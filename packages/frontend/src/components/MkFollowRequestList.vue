<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkPagination :key="type" :paginator="paginator">
	<template #empty><MkResult type="empty" :text="i18n.ts.noFollowRequests"/></template>
	<template #default="{items}">
		<div class="mk-follow-requests _gaps">
			<div v-for="req in items" :key="req.id" class="user _panel">
				<MkAvatar class="avatar" :user="displayUser(req)" indicator link preview/>
				<div class="body">
					<div class="name">
						<MkA v-user-preview="displayUser(req).id" class="name" :to="userPage(displayUser(req))"><MkUserName :user="displayUser(req)"/></MkA>
						<p class="acct">@{{ acct(displayUser(req)) }}</p>
					</div>
					<div v-if="type === 'list'" class="commands">
						<MkButton class="command" rounded primary @click="accept(displayUser(req))"><i class="ti ti-check"/> {{ i18n.ts.accept }}</MkButton>
						<MkButton class="command" rounded danger @click="reject(displayUser(req))"><i class="ti ti-x"/> {{ i18n.ts.reject }}</MkButton>
					</div>
					<div v-else class="commands">
						<MkButton class="command" rounded danger @click="cancel(displayUser(req))"><i class="ti ti-x"/> {{ i18n.ts.cancel }}</MkButton>
					</div>
				</div>
			</div>
		</div>
	</template>
</MkPagination>
</template>

<script lang="ts" setup>
import * as Misskey from 'misskey-js';
import { markRaw, watch } from 'vue';
import MkPagination from '@/components/MkPagination.vue';
import MkButton from '@/components/MkButton.vue';
import { userPage, acct } from '@/filters/user.js';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { Paginator } from '@/utility/paginator.js';

const props = defineProps<{
	// 'list' = pedidos recebidos, 'sent' = pedidos que você enviou
	type: 'list' | 'sent';
}>();

// mesmo padrão do código original: a troca de `type` recria o paginator e o
// :key no MkPagination força a remontagem.
let paginator: Paginator<'following/requests/list' | 'following/requests/sent'>;

watch(() => props.type, (newType) => {
	paginator = markRaw(new Paginator(newType === 'list' ? 'following/requests/list' : 'following/requests/sent', { limit: 10 }));
}, { immediate: true });

function accept(user: Misskey.entities.UserLite) {
	os.apiWithDialog('following/requests/accept', { userId: user.id }).then(() => {
		paginator.reload();
	});
}

function reject(user: Misskey.entities.UserLite) {
	os.apiWithDialog('following/requests/reject', { userId: user.id }).then(() => {
		paginator.reload();
	});
}

function cancel(user: Misskey.entities.UserLite) {
	os.apiWithDialog('following/requests/cancel', { userId: user.id }).then(() => {
		paginator.reload();
	});
}

function displayUser(req) {
	return props.type === 'list' ? req.follower : req.followee;
}
</script>

<style lang="scss" scoped>
.mk-follow-requests {
	> .user {
		display: flex;
		padding: 16px;

		> .avatar {
			display: block;
			flex-shrink: 0;
			margin: 0 12px 0 0;
			width: 42px;
			height: 42px;
			border-radius: 8px;
		}

		> .body {
			display: flex;
			width: calc(100% - 54px);
			position: relative;

			> .name {
				width: 45%;

				> .name,
				> .acct {
					display: block;
					width: 100%;
					white-space: nowrap;
					overflow: hidden;
					text-overflow: ellipsis;
					margin: 0;
				}

				> .name {
					font-size: 16px;
					line-height: 24px;
				}

				> .acct {
					font-size: 15px;
					line-height: 16px;
					opacity: 0.7;
				}
			}

			> .commands {
				position: absolute;
				top: 0;
				right: 0;
				display: flex;
				gap: 8px;

				> .command:not(:last-child) {
					margin-right: 8px;
				}
			}
		}
	}
}
</style>
