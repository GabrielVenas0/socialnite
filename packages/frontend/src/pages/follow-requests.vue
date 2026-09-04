<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader v-model:tab="tab" :actions="headerActions" :tabs="headerTabs" :swipable="true">
	<div :key="tab" class="_spacer" style="--MI_SPACER-w: 800px;">
		<MkFollowRequestList :type="tab === 'list' ? 'list' : 'sent'"/>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import MkFollowRequestList from '@/components/MkFollowRequestList.vue';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { $i } from '@/i.js';

const tab = ref($i?.isLocked ? 'list' : 'sent');

const headerActions = computed(() => []);

const headerTabs = computed(() => [
	{
		key: 'list',
		title: i18n.ts._followRequest.recieved,
		icon: 'ti ti-download',
	}, {
		key: 'sent',
		title: i18n.ts._followRequest.sent,
		icon: 'ti ti-upload',
	},
]);

definePage(() => ({
	title: i18n.ts.followRequests,
	icon: 'ti ti-user-plus',
}));
</script>
