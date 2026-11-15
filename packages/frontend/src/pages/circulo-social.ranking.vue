<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<!-- Ranking da semana do Círculo Social: top 10 dos últimos 7 dias, só do modo Minha rede. -->
<template>
<div class="_gaps_s">
	<b>Ranking da semana</b>
	<div v-if="ranking == null" :class="$style.vazio">Carregando…</div>
	<div v-else-if="ranking.length === 0" :class="$style.vazio">Ninguém jogou no modo Minha rede esta semana ainda.</div>
	<template v-else>
		<div v-for="(r, i) in ranking" :key="r.id" :class="$style.linha">
			<span :class="$style.posicao">{{ i + 1 }}</span>
			<MkAvatar :link="true" :class="$style.avatar" :user="r.user"/>
			<MkUserName :class="$style.nome" :user="r.user" :nowrap="true"/>
			<b :class="$style.pontos">{{ r.score }}</b>
		</div>
	</template>
</div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import type { CirculoSocialRankingRow } from '@/utility/rankings.js';
import { fetchCirculoSocialRanking } from '@/utility/rankings.js';

const ranking = ref<CirculoSocialRankingRow[] | null>(null);

// fetchCirculoSocialRanking usa POST, que não fica em cache: logo depois de uma
// partida, o ranking já vem com a pontuação nova.
onMounted(() => {
	fetchCirculoSocialRanking()
		.then(rows => { ranking.value = rows; })
		.catch(() => { ranking.value = []; });
});
</script>

<style lang="scss" module>
.vazio {
	opacity: 0.7;
	font-size: 0.9em;
}

.linha {
	display: flex;
	align-items: center;
	gap: 8px;
	line-height: 28px;
	white-space: nowrap;
}

.posicao {
	width: 1.5em;
	text-align: center;
	font-weight: bold;
	opacity: 0.6;
}

.avatar {
	width: 28px;
	height: 28px;
}

.nome {
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
}

.pontos {
	margin-left: auto;
}
</style>
