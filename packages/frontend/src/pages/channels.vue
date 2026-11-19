<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs" :swipable="true">
	<div class="_spacer" style="--MI_SPACER-w: 1200px;">
		<MkTip k="channels" style="margin-bottom: var(--MI-margin);">
			{{ i18n.ts.channelsAboutTip }}
		</MkTip>
		<!-- Social Nite: aba "Todos" — lista todos os canais e filtra enquanto você digita -->
		<div v-if="tab === 'search'" class="_gaps">
			<div :class="$style.searchRoot" class="_gaps_s">
				<MkInput v-model="searchQuery" :large="true" type="search" placeholder="Filtrar canais pelo nome ou descrição">
					<template #prefix><i class="ti ti-search"></i></template>
				</MkInput>
				<MkRadios v-model="searchType">
					<option value="nameAndDescription">{{ i18n.ts._channel.nameAndDescription }}</option>
					<option value="nameOnly">{{ i18n.ts._channel.nameOnly }}</option>
				</MkRadios>
			</div>
			<MkPagination v-slot="{items}" :paginator="allPaginator">
				<div :class="$style.root">
					<MkChannelPreview v-for="channel in items" :key="channel.id" :channel="channel"/>
				</div>
			</MkPagination>
		</div>
		<div v-else-if="tab === 'featured'">
			<MkPagination v-slot="{items}" :paginator="featuredPaginator">
				<div :class="$style.root">
					<MkChannelPreview v-for="channel in items" :key="channel.id" :channel="channel"/>
				</div>
			</MkPagination>
		</div>
		<div v-else-if="tab === 'favorites'">
			<MkPagination v-slot="{items}" :paginator="favoritesPaginator">
				<div :class="$style.root">
					<MkChannelPreview v-for="channel in items" :key="channel.id" :channel="channel"/>
				</div>
			</MkPagination>
		</div>
		<div v-else-if="tab === 'following'">
			<MkPagination v-slot="{items}" :paginator="followingPaginator">
				<div :class="$style.root">
					<MkChannelPreview v-for="channel in items" :key="channel.id" :channel="channel"/>
				</div>
			</MkPagination>
		</div>
		<div v-else-if="tab === 'owned'">
			<MkButton class="new" @click="create()"><i class="ti ti-plus"></i></MkButton>
			<MkPagination v-slot="{items}" :paginator="ownedPaginator">
				<div :class="$style.root">
					<MkChannelPreview v-for="channel in items" :key="channel.id" :channel="channel"/>
				</div>
			</MkPagination>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, markRaw, onMounted, ref, watch } from 'vue';
import { debounce } from 'throttle-debounce';
import MkChannelPreview from '@/components/MkChannelPreview.vue';
import MkPagination from '@/components/MkPagination.vue';
import MkInput from '@/components/MkInput.vue';
import MkRadios from '@/components/MkRadios.vue';
import MkButton from '@/components/MkButton.vue';
import { definePage } from '@/page.js';
import { i18n } from '@/i18n.js';
import { useRouter } from '@/router.js';
import { Paginator } from '@/utility/paginator.js';

const router = useRouter();

const props = defineProps<{
	query: string;
	type?: string;
}>();

const tab = ref('search');
const searchQuery = ref('');
const searchType = ref<'nameAndDescription' | 'nameOnly'>('nameAndDescription');
// O filtro só é aplicado 300 ms depois da última tecla, para não buscar a cada letra.
const filtro = ref('');
const aplicarFiltro = debounce(300, (q: string) => { filtro.value = q.trim(); });
watch(searchQuery, q => aplicarFiltro(q));

onMounted(() => {
	searchQuery.value = props.query ?? '';
	filtro.value = searchQuery.value.trim();
	searchType.value = props.type === 'nameOnly' ? 'nameOnly' : 'nameAndDescription';
});

// Com o filtro vazio, channels/search devolve todos os canais não arquivados, os mais novos primeiro.
const allPaginator = markRaw(new Paginator('channels/search', {
	// 15 por página e "Carregar mais" só quando a página veio cheia.
	limit: 15,
	canFetchDetection: 'limit',
	computedParams: computed(() => ({
		query: filtro.value,
		type: searchType.value,
	})),
}));

const featuredPaginator = markRaw(new Paginator('channels/featured', {
	limit: 10,
	noPaging: true,
}));
const favoritesPaginator = markRaw(new Paginator('channels/my-favorites', {
	limit: 100,
	noPaging: true,
}));
const followingPaginator = markRaw(new Paginator('channels/followed', {
	limit: 10,
}));
const ownedPaginator = markRaw(new Paginator('channels/owned', {
	limit: 10,
}));

function create() {
	router.push('/channels/new');
}

const headerActions = computed(() => [{
	icon: 'ti ti-plus',
	text: i18n.ts.create,
	handler: create,
}]);

const headerTabs = computed(() => [{
	key: 'search',
	title: 'Todos',
	icon: 'ti ti-list-search',
}, {
	key: 'featured',
	title: i18n.ts._channel.featured,
	icon: 'ti ti-comet',
}, {
	key: 'favorites',
	title: i18n.ts.favorites,
	icon: 'ti ti-star',
}, {
	key: 'following',
	title: i18n.ts._channel.following,
	icon: 'ti ti-eye',
}, {
	key: 'owned',
	title: i18n.ts._channel.owned,
	icon: 'ti ti-edit',
}]);

definePage(() => ({
	title: i18n.ts.channel,
	icon: 'ti ti-device-tv',
}));
</script>

<style lang="scss" module>
.searchRoot {
	width: 100%;
	max-width: 700px;
	margin: 0 auto;
}

.root {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
	gap: var(--MI-margin);
}
</style>
