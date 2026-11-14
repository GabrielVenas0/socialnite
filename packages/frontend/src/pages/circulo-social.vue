<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader>
	<Transition
		:enterActiveClass="$style.transition_zoom_enterActive"
		:leaveActiveClass="$style.transition_zoom_leaveActive"
		:enterFromClass="$style.transition_zoom_enterFrom"
		:leaveToClass="$style.transition_zoom_leaveTo"
		mode="out-in"
	>
		<div v-if="rede == null" class="_spacer" style="--MI_SPACER-w: 600px;">
			<div class="_gaps" :class="$style.root">
				<div class="_panel" :class="$style.logo">
					<img src="/client-assets/circulo-social/logo.png" alt="Círculo Social"/>
				</div>

				<div class="_panel _gaps" :class="$style.bloco">
					<div :class="$style.intro">Aprenda conjuntos e lógica com a sua própria rede: quem te segue, quem você segue, quem você silenciou e quem bloqueou.</div>
					<div :class="$style.modos">
						<button
							class="_button"
							:class="[$style.modo, modo === 'minha-rede' ? $style.modoAtivo : null]"
							:disabled="!minhaRedeServe"
							@click="modo = 'minha-rede'"
						>
							<i class="ti ti-users-group"></i>
							<b>Minha rede</b>
							<span>{{ textoMinhaRede }}</span>
						</button>
						<button
							class="_button"
							:class="[$style.modo, modo === 'ficticia' ? $style.modoAtivo : null]"
							@click="modo = 'ficticia'"
						>
							<i class="ti ti-school"></i>
							<b>Turma fictícia</b>
							<span>Ana, Bia, Caio, Duda, Edu e Fabi. Bom para treinar e para apresentar. Não vale para o ranking.</span>
						</button>
					</div>
					<MkButton primary gradate large rounded :class="$style.jogar" @click="jogar">
						<i class="ti ti-player-play"></i> Jogar
					</MkButton>
					<div v-if="recorde > 0" :class="$style.recorde"><i class="ti ti-trophy"></i> Seu recorde neste aparelho: {{ recorde }} de 840</div>
				</div>

				<div class="_panel _gaps_s" :class="$style.bloco">
					<b>Como jogar</b>
					<ol :class="$style.lista">
						<li>São 4 fases: Pertence ou não?, Círculos, Verdadeiro ou falso? e Todos ou algum?</li>
						<li>Cada fase começa com um cartão que explica os símbolos.</li>
						<li>Cada fase tem 6 rodadas, da mais fácil para a mais difícil. A rodada n vale 10 × n pontos.</li>
						<li>Errou? O jogo explica a resposta e segue para a próxima.</li>
					</ol>
				</div>

				<div class="_panel _gaps_s" :class="$style.bloco">
					<b>Ranking da semana</b>
					<div v-if="ranking == null" :class="$style.vazio">Carregando…</div>
					<div v-else-if="ranking.length === 0" :class="$style.vazio">Ninguém jogou no modo Minha rede esta semana ainda.</div>
					<template v-else>
						<div v-for="(r, i) in ranking" :key="r.id" :class="$style.rankingLinha">
							<span :class="$style.posicao">{{ i + 1 }}</span>
							<MkAvatar v-if="r.user" :link="true" :class="$style.rankingAvatar" :user="r.user"/>
							<MkUserName v-if="r.user" :class="$style.rankingNome" :user="r.user" :nowrap="true"/>
							<b :class="$style.rankingPontos">{{ r.score }}</b>
						</div>
					</template>
				</div>
			</div>
		</div>
		<div v-else class="_spacer" style="--MI_SPACER-w: 600px;">
			<XGame :rede="rede" @end="aoTerminar"/>
		</div>
	</Transition>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import * as Misskey from 'misskey-js';
import XGame from './circulo-social.game.vue';
import type { Rede } from '@/utility/circulo-social/dados.js';
import MkButton from '@/components/MkButton.vue';
import { definePage } from '@/page.js';
import { $i } from '@/i.js';
import { misskeyApiGet } from '@/utility/misskey-api.js';
import { lerMinhaRede, redeFicticia, redeServe } from '@/utility/circulo-social/dados.js';
import { lerRecorde, MODO_DO_RANKING } from '@/utility/circulo-social/recorde.js';

const modo = ref<'minha-rede' | 'ficticia'>('ficticia');
const minhaRede = ref<Rede | null>(null);
const carregando = ref(true);
const falhou = ref(false);
const rede = ref<Rede | null>(null);
const ranking = ref<Misskey.entities.BubbleGameRankingResponse | null>(null);
const recorde = ref(lerRecorde());

const minhaRedeServe = computed(() => minhaRede.value != null && redeServe(minhaRede.value));

const textoMinhaRede = computed(() => {
	if (carregando.value) return 'Lendo quem te segue, quem você segue, silenciados e bloqueados…';
	if (falhou.value) return 'Não deu para ler a sua rede agora. Tente de novo mais tarde.';
	if (minhaRede.value == null || !minhaRedeServe.value) {
		return 'Sua rede ainda é pequena para este modo: é preciso ter um amigo mútuo, um seguidor que você não segue de volta e alguém que você segue sem ser seguido.';
	}
	return `Usa os seus ${minhaRede.value.S.size} seguidores e ${minhaRede.value.G.size} seguidos. Vale para o ranking.`;
});

function carregarRanking() {
	misskeyApiGet('bubble-game/ranking', { gameMode: MODO_DO_RANKING })
		.then(r => { ranking.value = r; })
		.catch(() => { ranking.value = []; });
}

onMounted(async () => {
	carregarRanking();
	if ($i == null) {
		carregando.value = false;
		return;
	}
	try {
		minhaRede.value = await lerMinhaRede($i.id);
		if (redeServe(minhaRede.value)) modo.value = 'minha-rede';
	} catch {
		falhou.value = true;
	} finally {
		carregando.value = false;
	}
});

function jogar() {
	rede.value = modo.value === 'minha-rede' && minhaRede.value != null && minhaRedeServe.value ? minhaRede.value : redeFicticia();
}

function aoTerminar() {
	rede.value = null;
	recorde.value = lerRecorde();
	carregarRanking();
}

definePage(() => ({
	title: 'Círculo Social',
	icon: 'ti ti-chart-circles',
}));
</script>

<style lang="scss" module>
.transition_zoom_enterActive,
.transition_zoom_leaveActive {
	transition: opacity 0.4s cubic-bezier(0,.5,.5,1), transform 0.4s cubic-bezier(0,.5,.5,1) !important;
}
.transition_zoom_enterFrom,
.transition_zoom_leaveTo {
	opacity: 0;
	transform: scale(0.9);
}

.root {
	margin: 0 auto;
	max-width: 560px;
}

.logo {
	padding: 12px;

	> img {
		display: block;
		max-width: 100%;
		max-height: 220px;
		margin: auto;
	}
}

.bloco {
	padding: 18px;
}

.intro {
	text-align: center;
	line-height: 1.5;
}

.modos {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 10px;
}

.modo {
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	gap: 4px;
	padding: 12px 14px;
	border: 2px solid var(--MI_THEME-divider);
	border-radius: 12px;
	text-align: left;

	> i {
		font-size: 1.4em;
		color: var(--MI_THEME-accent);
	}

	> span {
		font-size: 0.85em;
		opacity: 0.75;
		line-height: 1.4;
	}

	&:disabled {
		opacity: 0.6;
	}
}

.modoAtivo {
	border-color: var(--MI_THEME-accent);
	background: var(--MI_THEME-accentedBg);
}

.jogar {
	width: 100%;
}

.recorde {
	text-align: center;
	font-size: 0.9em;
	opacity: 0.8;
}

.lista {
	margin: 0;
	padding-left: 1.2em;
	line-height: 1.6;
}

.vazio {
	opacity: 0.7;
	font-size: 0.9em;
}

.rankingLinha {
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

.rankingAvatar {
	width: 28px;
	height: 28px;
}

.rankingNome {
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
}

.rankingPontos {
	margin-left: auto;
}

@media (max-width: 480px) {
	.modos {
		grid-template-columns: 1fr;
	}
}
</style>
