<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs" :swipable="true">
	<div v-if="tab === 'overview'" class="_spacer" style="--MI_SPACER-w: 600px; --MI_SPACER-min: 20px;">
		<XOverview/>
	</div>
	<div v-else-if="tab === 'rules'" class="_spacer" style="--MI_SPACER-w: 700px; --MI_SPACER-min: 20px;">
		<XRules/>
	</div>
	<div v-else-if="tab === 'terms'" class="_spacer" style="--MI_SPACER-w: 700px; --MI_SPACER-min: 20px;">
		<XTerms/>
	</div>
	<div v-else-if="tab === 'emojis'" class="_spacer" style="--MI_SPACER-w: 1000px; --MI_SPACER-min: 20px;">
		<XEmojis/>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, ref, watch } from 'vue';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';

const XOverview = defineAsyncComponent(() => import('@/pages/about.overview.vue'));
const XRules = defineAsyncComponent(() => import('@/pages/about.rules.vue'));
const XTerms = defineAsyncComponent(() => import('@/pages/about.terms.vue'));
const XEmojis = defineAsyncComponent(() => import('@/pages/about.emojis.vue'));

const props = withDefaults(defineProps<{
	initialTab?: string;
}>(), {
	initialTab: 'overview',
});

const tab = ref(props.initialTab);

const headerActions = computed(() => []);

const headerTabs = computed(() => [{
	key: 'overview',
	title: i18n.ts.overview,
}, {
	// Social Nite: regulamento e termos vivem aqui, versionados no repositório
	key: 'rules',
	title: i18n.ts.serverRules,
	icon: 'ti ti-checkup-list',
}, {
	key: 'terms',
	title: i18n.ts.termsOfService,
	icon: 'ti ti-license',
}, {
	key: 'emojis',
	title: i18n.ts.customEmojis,
	icon: 'ti ti-icons',
}]);

definePage(() => ({
	title: i18n.ts.instanceInfo,
	icon: 'ti ti-info-circle',
}));
</script>
