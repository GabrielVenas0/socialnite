<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions">
	<MkPolkadots accented :height="200" style="margin-bottom: -200px;"/>
	<div class="_spacer" style="--MI_SPACER-w: 700px;">
		<XHome/>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import XHome from './home.home.vue';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import MkPolkadots from '@/components/MkPolkadots.vue';

// Social Nite: o chat é só 1-a-1. As abas de salas (convites, salas ingressadas e
// salas criadas) saíram — conversa em grupo é papel dos Canais.
const headerActions = computed(() => []);

definePage(() => ({
	title: i18n.ts.directMessage,
	icon: 'ti ti-messages',
}));
</script>

<style lang="scss" module>
</style>
