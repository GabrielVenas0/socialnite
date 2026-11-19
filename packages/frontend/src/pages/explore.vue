<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs" :swipable="true">
	<div class="_spacer" style="--MI_SPACER-w: 1200px; padding-bottom: 0;">
		<MkTip k="explore">
			{{ i18n.ts.exploreAboutTip }}
		</MkTip>
		<!-- Social Nite: a busca de pessoas fica aqui (antes era a página "Pesquisar usuário") -->
		<div :class="$style.busca">
			<MkInput v-model="busca" type="search" :large="true" placeholder="Buscar pessoas pelo nome ou @">
				<template #prefix><i class="ti ti-user-search"></i></template>
			</MkInput>
		</div>
	</div>
	<div v-if="buscaPaginator" class="_spacer" style="--MI_SPACER-w: 1200px;">
		<MkUserList :key="buscaAplicada" :paginator="buscaPaginator"/>
	</div>
	<div v-else-if="tab === 'featured'">
		<XFeatured/>
	</div>
	<div v-else-if="tab === 'users'">
		<XUsers/>
	</div>
	<div v-else-if="tab === 'roles'">
		<XRoles/>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, watch, ref, shallowRef, markRaw } from 'vue';
import { debounce } from 'throttle-debounce';
import XFeatured from './explore.featured.vue';
import XUsers from './explore.users.vue';
import XRoles from './explore.roles.vue';
import { definePage } from '@/page.js';
import { i18n } from '@/i18n.js';
import MkInput from '@/components/MkInput.vue';
import MkUserList from '@/components/MkUserList.vue';
import { Paginator } from '@/utility/paginator.js';

const props = withDefaults(defineProps<{
	initialTab?: string;
}>(), {
	initialTab: 'featured',
});

const tab = ref(props.initialTab);

// Social Nite: busca de pessoas enquanto digita (400 ms depois da última tecla).
// Com a busca vazia, a página mostra as abas normais do Explorar.
const busca = ref('');
const buscaAplicada = ref('');
const buscaPaginator = shallowRef<Paginator<'users/search'> | null>(null);
const aplicarBusca = debounce(400, (q: string) => {
	const query = q.trim().replace(/^@/, '');
	buscaAplicada.value = query;
	buscaPaginator.value = query === '' ? null : markRaw(new Paginator('users/search', {
		limit: 15,
		offsetMode: true,
		canFetchDetection: 'limit',
		params: { query, origin: 'local' },
	}));
});
watch(busca, q => aplicarBusca(q));

const headerActions = computed(() => []);

const headerTabs = computed(() => [{
	key: 'featured',
	icon: 'ti ti-bolt',
	title: i18n.ts.featured,
}, {
	key: 'users',
	icon: 'ti ti-users',
	title: i18n.ts.users,
}, {
	key: 'roles',
	icon: 'ti ti-badges',
	title: i18n.ts.roles,
}]);

definePage(() => ({
	title: i18n.ts.explore,
	icon: 'ti ti-hash',
}));
</script>

<style lang="scss" module>
.busca {
	margin-top: var(--MI-margin);
}
</style>
