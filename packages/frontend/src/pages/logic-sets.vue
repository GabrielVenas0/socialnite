<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader>
	<div class="_spacer" style="--MI_SPACER-w: 800px;">
		<div class="_gaps">
			<div class="_panel _gaps" style="padding: 20px;">
				<div>
					<h2 style="margin: 0 0 8px;">SocialNite &amp; Simulator</h2>
					<div :class="$style.muted">Simulação vetorial R⁵, rating demonstrativo e desafios de lógica.</div>
				</div>

				<div :class="$style.tabs" role="group" aria-label="Seções do jogo">
					<MkButton :active="activeTab === 'feed'" :aria-pressed="activeTab === 'feed'" @click="activeTab = 'feed'">
						Feed &amp; Simulação (R⁵)
					</MkButton>
					<MkButton :active="activeTab === 'minigame'" :aria-pressed="activeTab === 'minigame'" @click="activeTab = 'minigame'">
						Logic &amp; Sets
					</MkButton>
				</div>
			</div>

			<div v-show="activeTab === 'feed'" class="_panel _gaps" style="padding: 20px;">
				<h3 style="margin: 0;">Feed de demonstração</h3>
				<div :class="$style.post">
					<p style="margin: 0 0 12px;">{{ post.content }}</p>
					<div :class="$style.postMeta">
						<span>ID: {{ post.id }}</span>
						<strong>Rating simulado: {{ post.eloRating }} pts</strong>
					</div>
				</div>

				<div>
					<h4 style="margin: 0 0 12px;">Recomendações de emojis (combinação linear)</h4>
					<div :class="$style.reactions">
						<MkButton
							v-for="recommendation in recommendations"
							:key="recommendation.symbol"
							:class="$style.reaction"
							:aria-label="`Reagir com ${recommendation.symbol}`"
							@click="handleReact(recommendation.symbol)"
						>
							<span :class="$style.emoji">{{ recommendation.symbol }}</span>
							<span :class="$style.score">Score: {{ recommendation.score.toFixed(2) }}</span>
						</MkButton>
					</div>
					<p :class="$style.note">
						Cada reação simula um resultado favorável contra o rating de referência 1200.
						{{ lastReaction ? `Última reação: ${lastReaction} — ${lastEloDelta >= 0 ? '+' : ''}${lastEloDelta} pontos Elo.` : '' }}
					</p>
				</div>

				<div :class="$style.eloExplanation">
					<strong>O que aconteceu com o Elo?</strong>
					<p>
						A fórmula compara a expectativa de resultado com o resultado simulado:
						<code>R novo = R + K × (S − E)</code>. Neste exemplo, K = 16 e cada reação vale como
						um resultado favorável. Contra o rating fictício de 1200, a expectativa atual é
						{{ (lastExpectedScore * 100).toFixed(1) }}%.
					</p>
					<p>
						Com rating igual ao de referência, uma vitória simulada aumenta 8 pontos.
						A mudança depende da diferença entre os ratings; os dados são fictícios e locais.
					</p>
					<div :class="$style.bonusSummary">
						<span>Rating Elo de demonstração</span><strong>{{ post.eloRating }}</strong>
						<span>Bônus educativo por partidas concluídas</span><strong>+{{ gameBonusPoints }}</strong>
					</div>
				</div>
			</div>

			<LogicSetsChallenge v-show="activeTab === 'minigame'" :eloRating="post.eloRating" @completed="gameBonusPoints += $event"/>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import MkButton from '@/components/MkButton.vue';
import LogicSetsChallenge from '@/components/LogicSetsChallenge.vue';
import { definePage } from '@/page.js';
import { calculateElo } from '@/utility/logic-sets-game.js';

type Vector5D = [number, number, number, number, number];
type GameTab = 'feed' | 'minigame';

interface EmojiOption {
	symbol: string;
	vector: Vector5D;
}

interface PostModel {
	id: string;
	content: string;
	eloRating: number;
	vector: Vector5D;
}

interface UserModel {
	preferenceVector: Vector5D;
}

const availableEmojis: EmojiOption[] = [
	{ symbol: '👏', vector: [0.7, 0.3, 0.8, 0.2, 0.5] },
	{ symbol: '🔥', vector: [0.1, 0.9, 0.9, 0.4, 0.2] },
	{ symbol: '💡', vector: [0.9, 0.2, 0.5, 0.8, 0.9] },
	{ symbol: '❤️', vector: [0.2, 0.8, 0.7, 0.3, 0.6] },
];

const user: UserModel = {
	preferenceVector: [0.8, 0.2, 0.6, 0.5, 0.4],
};

const activeTab = ref<GameTab>('minigame');
const post = ref<PostModel>({
	id: 'post-01',
	content: 'Arquitetura de microsserviços e algoritmos em TypeScript',
	eloRating: 1250,
	vector: [0.85, 0.1, 0.4, 0.7, 0.5],
});
const lastReaction = ref<string | null>(null);
const lastEloDelta = ref(0);
const lastExpectedScore = ref(0.5);
const gameBonusPoints = ref(0);

function dotProduct(v1: Vector5D, v2: Vector5D): number {
	return v1.reduce((sum, value, index) => sum + value * v2[index], 0);
}

function calculateEmojiScores(currentUser: UserModel, currentPost: PostModel, emojis: EmojiOption[]) {
	const normalizedElo = Math.min(Math.max(currentPost.eloRating / 2000, 0), 1);

	return emojis.map(emoji => ({
		symbol: emoji.symbol,
		score: 0.4 * dotProduct(currentUser.preferenceVector, emoji.vector)
			+ 0.4 * dotProduct(currentPost.vector, emoji.vector)
			+ 0.2 * normalizedElo,
	})).sort((a, b) => b.score - a.score);
}

const recommendations = computed(() => calculateEmojiScores(user, post.value, availableEmojis));

function handleReact(symbol: string) {
	const result = calculateElo(post.value.eloRating, 1200, 1);
	lastReaction.value = symbol;
	lastEloDelta.value = result.delta;
	lastExpectedScore.value = result.expectedScore;
	post.value = { ...post.value, eloRating: result.newRating };
}

definePage(() => ({
	title: 'Logic & Sets Challenge',
	icon: 'ti ti-brain',
}));
</script>

<style lang="scss" module>
.muted,
.note {
	opacity: 0.7;
	font-size: 0.9em;
}

.tabs,
.reactions {
	display: flex;
	flex-wrap: wrap;
	gap: 10px;
}

.post {
	padding: 16px;
	border-left: 4px solid var(--MI_THEME-accent);
	border-radius: 8px;
	background: var(--MI_THEME-panelHighlight);
}

.postMeta {
	display: flex;
	justify-content: space-between;
	gap: 12px;
	font-size: 0.85em;
	opacity: 0.75;
}

.reaction {
	flex: 1 1 100px;
	height: auto;
	min-height: 72px;
}

.emoji,
.score {
	display: block;
}

.emoji {
	font-size: 24px;
}

.score {
	margin-top: 4px;
	font-size: 0.8em;
	opacity: 0.75;
}

.note {
	margin: 12px 0 0;
	text-align: center;
}

.eloExplanation {
	padding: 16px;
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 10px;
	line-height: 1.55;

	p {
		margin: 8px 0;
		opacity: 0.8;
	}

	code {
		font-weight: 700;
		color: var(--MI_THEME-accent);
	}
}

.bonusSummary {
	display: grid;
	grid-template-columns: 1fr auto;
	gap: 8px 14px;
	padding-top: 10px;
	border-top: 1px solid var(--MI_THEME-divider);

	strong {
		text-align: right;
		color: var(--MI_THEME-accent);
	}
}

@media (max-width: 500px) {
	.postMeta {
		flex-direction: column;
		gap: 4px;
	}
}
</style>
