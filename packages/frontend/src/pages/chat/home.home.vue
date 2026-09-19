<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<MkTip k="chat">
		{{ i18n.ts._chat.chatAboutTip }}
	</MkTip>

	<MkButton v-if="$i.policies.chatAvailability === 'available'" primary gradate rounded :class="$style.start" @click="start"><i class="ti ti-plus"></i> {{ i18n.ts.startChat }}</MkButton>

	<MkInfo v-else>{{ $i.policies.chatAvailability === 'readonly' ? i18n.ts._chat.chatIsReadOnlyForThisAccountOrServer : i18n.ts._chat.chatNotAvailableForThisAccountOrServer }}</MkInfo>

	<MkAd :preferForms="['horizontal', 'horizontal-big']"/>

	<MkInput
		v-model="searchQuery"
		:placeholder="i18n.ts._chat.searchMessages"
		type="search"
	>
		<template #prefix><i class="ti ti-search"></i></template>
	</MkInput>

	<MkButton v-if="searchQuery.length > 0" primary rounded @click="search">{{ i18n.ts.search }}</MkButton>

	<MkFoldableSection v-if="searched">
		<template #header>{{ i18n.ts.searchResult }}</template>

		<div class="_gaps_s">
			<div v-for="message in searchResults" :key="message.id" :class="$style.searchResultItem">
				<XMessage :message="message" :isSearchResult="true"/>
			</div>
		</div>
	</MkFoldableSection>

	<MkFoldableSection>
		<template #header>{{ i18n.ts._chat.history }}</template>

		<MkChatHistories/>
	</MkFoldableSection>

	<MkFoldableSection v-if="invitations.length > 0">
		<template #header>{{ i18n.ts._chat.invitations }}</template>
		<XInvitations/>
	</MkFoldableSection>

	<MkFoldableSection>
		<template #header>{{ i18n.ts._chat.groupChats }}</template>

		<MkLoading v-if="roomsFetching"/>
		<div v-else-if="rooms.length === 0" :class="$style.emptyHint">
			{{ i18n.ts._chat.noGroupChatsYet }}
		</div>
		<div v-else class="_gaps_s">
			<XRoom v-for="room in rooms" :key="room.id" :room="room"/>
		</div>
	</MkFoldableSection>

	<MkFoldableSection v-if="$i.policies.chatAvailability === 'available'">
		<template #header>{{ showingNetwork ? 'Pessoas da rede' : i18n.ts._chat.startWithSomeoneYouFollow }}</template>

		<MkLoading v-if="peopleFetching"/>
		<div v-else-if="people.length === 0" :class="$style.noFollowing">
			{{ i18n.ts._chat.noFollowingToChatWith }}
		</div>
		<div v-else class="_gaps_s">
			<MkA
				v-for="person in people"
				:key="person.id"
				class="_panel"
				:class="$style.person"
				:to="`/chat/user/${person.id}`"
			>
				<MkAvatar :class="$style.personAvatar" :user="person" indicator :preview="false"/>
				<div :class="$style.personBody">
					<MkUserName :class="$style.personName" :user="person"/>
					<MkAcct :class="$style.personAcct" :user="person"/>
				</div>
				<i class="ti ti-message" :class="$style.personIcon"></i>
			</MkA>
		</div>
	</MkFoldableSection>
</div>
</template>

<script lang="ts" setup>
import { onActivated, onDeactivated, onMounted, ref } from 'vue';
import * as Misskey from 'misskey-js';
import { useInterval } from '@@/js/use-interval.js';
import XMessage from './XMessage.vue';
import XRoom from './XRoom.vue';
import XInvitations from './home.invitations.vue';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { ensureSignin } from '@/i.js';
import { useRouter } from '@/router.js';
import * as os from '@/os.js';
import { updateCurrentAccountPartial } from '@/accounts.js';
import MkInput from '@/components/MkInput.vue';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkChatHistories from '@/components/MkChatHistories.vue';

const $i = ensureSignin();

const router = useRouter();

const searchQuery = ref('');
const searched = ref(false);
const searchResults = ref<Misskey.entities.ChatMessage[]>([]);

// Social Nite: lista quem você segue direto aqui, para dar de onde começar uma
// conversa sem ter que adivinhar o nome de alguém no seletor. Em servidor novo
// ninguém segue ninguém ainda, então cai para as pessoas da própria rede.
const people = ref<Misskey.entities.UserLite[]>([]);
const peopleFetching = ref(true);
const showingNetwork = ref(false);

misskeyApi('users/following', { userId: $i.id, limit: 30 }).then(async res => {
	const followees = res.map(f => f.followee).filter(u => u != null);

	if (followees.length > 0) {
		people.value = followees;
		return;
	}

	showingNetwork.value = true;
	people.value = (await misskeyApi('users', {
		origin: 'local',
		sort: '+updatedAt',
		limit: 30,
	})).filter(u => u.id !== $i.id);
}).finally(() => {
	peopleFetching.value = false;
});

// Social Nite: grupos de conversa (salas) — os que você criou e os que participa,
// numa lista só, em vez das três abas separadas do Misskey original.
const rooms = ref<Misskey.entities.ChatRoom[]>([]);
const roomsFetching = ref(true);

Promise.all([
	misskeyApi('chat/rooms/owned', {}),
	misskeyApi('chat/rooms/joining', {}),
]).then(([owned, joining]) => {
	const joined = joining.map(m => m.room).filter(r => r != null) as Misskey.entities.ChatRoom[];
	const seen = new Set<string>();
	rooms.value = [...owned, ...joined].filter(r => {
		if (seen.has(r.id)) return false;
		seen.add(r.id);
		return true;
	});
}).finally(() => {
	roomsFetching.value = false;
});

const invitations = ref<Misskey.entities.ChatRoomInvitation[]>([]);

misskeyApi('chat/rooms/invitations/inbox', {}).then(res => {
	invitations.value = res;
});

function start(ev: MouseEvent) {
	os.popupMenu([{
		text: i18n.ts._chat.individualChat,
		caption: i18n.ts._chat.individualChat_description,
		icon: 'ti ti-user',
		action: () => { startUser(); },
	}, {
		text: i18n.ts._chat.createRoom,
		caption: i18n.ts._chat.roomChat_description,
		icon: 'ti ti-users-group',
		action: () => { createRoom(); },
	}], ev.currentTarget ?? ev.target);
}

async function createRoom() {
	const { canceled, result } = await os.inputText({
		title: i18n.ts._chat.groupChatName,
		minLength: 1,
	});
	if (canceled) return;

	const room = await misskeyApi('chat/rooms/create', {
		name: result,
	});

	router.push('/chat/room/:roomId', {
		params: {
			roomId: room.id,
		},
	});
}

async function startUser() {
	// TODO: localOnly は連合に対応したら消す
	os.selectUser({ localOnly: true }).then(user => {
		router.push('/chat/user/:userId', {
			params: {
				userId: user.id,
			}
		});
	});
}

async function search() {
	const res = await misskeyApi('chat/messages/search', {
		query: searchQuery.value,
	});

	searchResults.value = res;
	searched.value = true;
}

onMounted(() => {
	updateCurrentAccountPartial({ hasUnreadChatMessages: false });
});
</script>

<style lang="scss" module>
.start {
	margin: 0 auto;
}

.searchResultItem {
	padding: 12px;
	border: solid 1px var(--MI_THEME-divider);
	border-radius: 12px;
}

.noFollowing,
.emptyHint {
	padding: 16px;
	text-align: center;
	font-size: 0.9em;
	color: var(--MI_THEME-fgTransparentWeak);
}

.person {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 12px 16px;

	&:hover {
		text-decoration: none;
		background: var(--MI_THEME-panelHighlight);
	}
}

.personAvatar {
	flex-shrink: 0;
	width: 42px;
	height: 42px;
}

.personBody {
	flex: 1;
	min-width: 0;
}

.personName {
	display: block;
	font-weight: bold;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.personAcct {
	display: block;
	font-size: 0.9em;
	opacity: 0.7;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.personIcon {
	flex-shrink: 0;
	opacity: 0.5;
}
</style>
