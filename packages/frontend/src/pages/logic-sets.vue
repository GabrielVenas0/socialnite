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

			<div v-if="activeTab === 'feed'" class="_panel _gaps" style="padding: 20px;">
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
						Cada reação adiciona 32 pontos ao rating local. {{ lastReaction ? `Última reação: ${lastReaction}` : '' }}
					</p>
				</div>
			</div>

			<div v-else class="_panel _gaps" style="padding: 20px;">
				<h3 style="margin: 0;">Desafio de Lógica e Conjuntos</h3>

				<section v-if="gameStep === 1" class="_gaps_s">
					<strong>Fase 1: Teoria dos conjuntos</strong>
					<p style="margin: 0;">
						Seja U o conjunto de utilizadores ativos e V o conjunto de utilizadores que visualizaram a publicação post-01.
						Qual operação representa os utilizadores ativos que visualizaram essa publicação?
					</p>
					<div :class="$style.choices">
						<MkButton @click="checkSetChallenge('union')">A) União (U ∪ V)</MkButton>
						<MkButton @click="checkSetChallenge('intersection')">B) Intersecção (U ∩ V)</MkButton>
						<MkButton @click="checkSetChallenge('difference')">C) Diferença (U \ V)</MkButton>
					</div>
				</section>

				<section v-else-if="gameStep === 2" class="_gaps_s">
					<strong>Fase 2: Lógica matemática (condicional)</strong>
					<p style="margin: 0;">
						Na proposição p → q, qual é o valor lógico quando p = Verdadeiro (autenticado) e
						q = Falso (não conectado)? Selecione o valor da condicional.
					</p>
					<div :class="$style.choices" role="radiogroup" aria-label="Valor da condicional">
						<label :class="$style.answer">
							<input v-model="logicAnswer" type="radio" name="logic-answer" :value="true"/>
							Verdadeiro (V)
						</label>
						<label :class="$style.answer">
							<input v-model="logicAnswer" type="radio" name="logic-answer" :value="false"/>
							Falso (F)
						</label>
					</div>
					<MkButton primary :disabled="logicAnswer === null" @click="checkLogicChallenge">Validar resposta</MkButton>
				</section>

				<section v-else class="_gaps_s">
					<strong>Desafio concluído!</strong>
					<p style="margin: 0;">Respondeste corretamente às duas fases. O rating de demonstração recebeu +50 pontos.</p>
					<MkButton @click="resetGame">Jogar novamente</MkButton>
				</section>

				<div v-if="gameFeedback" :class="$style.feedback" role="status" aria-live="polite">
					{{ gameFeedback }}
				</div>
			</div>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import MkButton from '@/components/MkButton.vue';
import { definePage } from '@/page.js';

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

const activeTab = ref<GameTab>('feed');
const post = ref<PostModel>({
	id: 'post-01',
	content: 'Arquitetura de microsserviços e algoritmos em TypeScript',
	eloRating: 1250,
	vector: [0.85, 0.1, 0.4, 0.7, 0.5],
});
const lastReaction = ref<string | null>(null);
const gameStep = ref(1);
const logicAnswer = ref<boolean | null>(null);
const gameFeedback = ref('');

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
	lastReaction.value = symbol;
	post.value = { ...post.value, eloRating: post.value.eloRating + 32 };
}

function checkSetChallenge(choice: string) {
	if (choice === 'intersection') {
		gameFeedback.value = 'Correto! A intersecção U ∩ V contém os utilizadores que pertencem aos dois conjuntos.';
		gameStep.value = 2;
		logicAnswer.value = null;
	} else {
		gameFeedback.value = 'Ainda não. Procura os utilizadores que estão simultaneamente em U e em V.';
	}
}

function checkLogicChallenge() {
	if (logicAnswer.value === false) {
		gameFeedback.value = 'Correto! V → F é falso. Recebeste +50 pontos no rating de demonstração.';
		post.value = { ...post.value, eloRating: post.value.eloRating + 50 };
		gameStep.value = 3;
	} else {
		gameFeedback.value = 'Incorreto. Uma condicional só é falsa quando o antecedente é verdadeiro e o consequente é falso.';
	}
}

function resetGame() {
	gameStep.value = 1;
	logicAnswer.value = null;
	gameFeedback.value = '';
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
.reactions,
.choices {
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

.choices {
	flex-direction: column;
	align-items: flex-start;
}

.answer {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: 6px 0;
	cursor: pointer;
}

.feedback {
	padding: 12px;
	border-radius: 6px;
	background: var(--MI_THEME-infoBg);
	color: var(--MI_THEME-infoFg);
}

@media (max-width: 500px) {
	.postMeta {
		flex-direction: column;
		gap: 4px;
	}
}
</style>
