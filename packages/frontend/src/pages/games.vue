<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader>
	<div class="_spacer" style="--MI_SPACER-w: 800px;">
		<div class="_gaps">
			<div class="_panel" :class="$style.link">
				<MkA to="/bubble-game">
					<img src="/client-assets/drop-and-fusion/logo.png?v=2" style="display: block; max-width: 100%; max-height: 200px; margin: auto;"/>
				</MkA>
			</div>
			<div class="_panel" :class="$style.link">
				<MkA to="/circulo-social">
					<img src="/client-assets/circulo-social/logo.png" alt="Círculo Social" style="display: block; max-width: 100%; max-height: 200px; margin: auto;"/>
				</MkA>
			</div>
			<div class="_panel" :class="$style.link">
				<MkA to="/reversi">
					<img src="/client-assets/reversi/logo.png?v=2" style="display: block; max-width: 100%; max-height: 200px; margin: auto;"/>
				</MkA>
			</div>
			<MkA to="/logic-sets" class="_panel" :class="[$style.link, $style.challenge]">
				<div class="_gaps_s">
					<div :class="$style.challengeIcon" aria-hidden="true">🧠</div>
					<div>
						<strong>Logic &amp; Sets Challenge</strong>
						<div :class="$style.description">Desafios de conjuntos e lógica com uma simulação de feed vetorial.</div>
					</div>
				</div>
			</MkA>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { definePage } from '@/page.js';

definePage(() => ({
	title: 'Nite Games',
	icon: 'ti ti-device-gamepad',
}));
</script>

<style module>
.link:focus-within {
	outline: 2px solid var(--MI_THEME-focus);
	outline-offset: -2px;
}

.challenge {
	display: block;
	padding: 20px;
	color: inherit;
	text-decoration: none;
}

.challengeIcon {
	font-size: 32px;
}

.description {
	margin-top: 6px;
	opacity: 0.7;
	font-size: 0.9em;
}
</style>
