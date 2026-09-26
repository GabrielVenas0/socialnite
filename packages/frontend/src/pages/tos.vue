<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader>
	<div class="_spacer" style="--MI_SPACER-w: 800px;">
		<XTerms/>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import XTerms from '@/pages/about.terms.vue';
import { definePage } from '@/page.js';

definePage(() => ({
	title: 'Termos de Uso',
	icon: 'ti ti-license',
}));
</script>
