<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="meta" :class="$style.root">
	<MkFeaturedPhotos :class="$style.bg"/>
	<div :class="$style.contents">
		<MkVisitorDashboard/>
	</div>
</div>
</template>

<script lang="ts" setup>
import MkFeaturedPhotos from '@/components/MkFeaturedPhotos.vue';
import MkVisitorDashboard from '@/components/MkVisitorDashboard.vue';
import { instance as meta } from '@/instance.js';
import { store } from '@/store.js';

// The entrance screen is the first thing anyone sees, so it always shows
// dark/blue branding here regardless of any previously stored preference.
if (!store.s.darkMode) {
	store.set('darkMode', true);
}
</script>

<style lang="scss" module>
.root {
	height: 100cqh;
	overflow: auto;
	overscroll-behavior: contain;
}

.bg {
	position: fixed;
	top: 0;
	right: 0;
	width: 100vw;
	height: 100vh;
}

.contents {
	position: relative;
	width: min(430px, calc(100% - 32px));
	margin: auto;
	padding: 100px 0 100px 0;

	// Em telas grandes o card ocupa mais espaco para nao parecer um layout mobile esticado
	@media (min-width: 1200px) {
		width: min(620px, calc(100% - 64px));
	}

	@media (min-width: 1700px) {
		width: min(700px, calc(100% - 64px));
	}
}
</style>
