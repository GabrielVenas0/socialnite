<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<div v-if="gameState === 'intro'" class="_panel _gaps" :class="$style.card">
		<img
			src="/client-assets/logic-sets/logo.svg"
			alt="Logic & Sets Challenge: Elo Rating e Simulação Matemática"
			:class="$style.logo"
		/>
		<div :class="$style.intro">
			<h2 style="margin: 0;">Aprenda matemática jogando</h2>
			<p style="margin: 0;">
				Um jogo interativo de Modelagem e Simulação Matemática. Você não precisa conhecer a matéria:
				cada fase apresenta a ideia, oferece uma dica opcional e explica a resposta antes de avançar.
			</p>
		</div>

		<div :class="$style.instructions">
			<strong><i class="ti ti-map-2"></i> Como a partida funciona</strong>
			<ol>
				<li>Explore os cinco temas abaixo, na ordem que preferir.</li>
				<li>Comece uma partida de cinco perguntas: uma por tema, sorteada novamente em cada tentativa.</li>
				<li>Escolha uma resposta. Ela fica registrada; não será possível alterá-la, mesmo se estiver errada.</li>
				<li>Leia a explicação, avance no seu ritmo e reveja os erros ao final.</li>
				<li>Concluir a partida libera 10 pontos-bônus do jogo, registrados separadamente do rating Elo.</li>
			</ol>
		</div>

		<div class="_gaps_s" :class="$style.lessons">
			<details v-for="lesson in lessons" :key="lesson.title" :class="$style.lesson">
				<summary>
					<span :class="$style.lessonIcon"><i :class="lesson.icon"></i></span>
					<span><strong>{{ lesson.title }}</strong><small>{{ lesson.subtitle }}</small></span>
					<i class="ti ti-chevron-down" :class="$style.chevron"></i>
				</summary>
				<div :class="$style.lessonBody">
					<p>{{ lesson.description }}</p>
					<div :class="$style.example">{{ lesson.example }}</div>
					<p :class="$style.lessonConnection"><i class="ti ti-device-gamepad-2"></i> {{ lesson.connection }}</p>
				</div>
			</details>
		</div>

		<div :class="$style.ratingPreview">
			<div>
				<strong><i class="ti ti-chart-arrows-vertical"></i> Elo Rating no simulador</strong>
				<p>
					No Feed, cada reação conta como um resultado favorável contra um rating de referência fictício de 1200.
					O rating muda pela fórmula Elo, não por uma soma fixa. É uma demonstração local, não altera a conta
					nem avalia pessoas reais.
				</p>
				<code>R novo = R atual + K × (S − E)</code>
				<small>E = resultado esperado · S = resultado observado · K = sensibilidade da atualização</small>
			</div>
		</div>

		<MkButton primary gradate large rounded :class="$style.startButton" @click="startGame">
			<i class="ti ti-player-play"></i> Começar a partida
		</MkButton>
	</div>

	<div v-else-if="gameState === 'playing' && currentQuestion" class="_panel _gaps" :class="$style.card">
		<div :class="$style.gameHeader">
			<div>
				<div :class="$style.kicker">DESAFIO INTERATIVO</div>
				<h2 style="margin: 4px 0 0;">{{ currentQuestion.topic }}</h2>
			</div>
			<MkButton small @click="gameState = 'intro'"><i class="ti ti-book-2"></i> Ver explicações</MkButton>
		</div>

		<div :class="$style.progressText">
			<span>Nível {{ currentQuestion.level }} de {{ questions.length }}</span>
			<span>{{ correctCount }} {{ correctCount === 1 ? 'acerto' : 'acertos' }}</span>
		</div>
		<progress :value="currentIndex + 1" :max="questions.length" :aria-label="`Progresso: pergunta ${currentIndex + 1} de ${questions.length}`" :class="$style.progress"/>

		<div :class="$style.questionArea">
			<div :class="$style.questionNumber">PERGUNTA {{ currentIndex + 1 }}</div>
			<p :class="$style.question">{{ currentQuestion.prompt }}</p>
			<details :class="$style.hint">
				<summary><i class="ti ti-bulb"></i> Precisa de uma pista?</summary>
				<p>{{ currentQuestion.hint }}</p>
			</details>

			<div :class="$style.options" role="group" :aria-label="`Respostas da pergunta ${currentIndex + 1}`">
				<MkButton
					v-for="option in currentQuestion.options"
					:key="option"
					full
					:active="selectedAnswer === option"
					:primary="hasAnswered && option === currentQuestion.answer"
					:danger="hasAnswered && selectedAnswer === option && selectedAnswer !== currentQuestion.answer"
					:disabled="hasAnswered"
					:aria-pressed="selectedAnswer === option"
					:class="$style.option"
					@click="answerQuestion(option)"
				>
					<span>{{ option }}</span>
					<i v-if="hasAnswered && option === currentQuestion.answer" class="ti ti-check" aria-label="Resposta correta"></i>
					<i v-else-if="hasAnswered && selectedAnswer === option" class="ti ti-x" aria-label="Sua resposta"></i>
				</MkButton>
			</div>
		</div>

		<div v-if="hasAnswered" :class="[$style.feedback, selectedAnswer === currentQuestion.answer ? $style.correct : $style.incorrect]" role="status" aria-live="polite">
			<strong>
				<i :class="selectedAnswer === currentQuestion.answer ? 'ti ti-circle-check' : 'ti ti-info-circle'"></i>
				{{ selectedAnswer === currentQuestion.answer ? 'Isso mesmo!' : 'Resposta registrada — vamos entender juntos.' }}
			</strong>
			<p v-if="selectedAnswer !== currentQuestion.answer">
				A opção correta era <b>{{ currentQuestion.answer }}</b>.
			</p>
			<p>{{ currentQuestion.explanation }}</p>
		</div>

		<div v-if="hasAnswered" :class="$style.continueRow">
			<MkButton primary rounded @click="continueGame">
				{{ currentIndex + 1 === questions.length ? 'Ver resultado' : 'Entendi, próxima pergunta' }}
				<i class="ti ti-arrow-right"></i>
			</MkButton>
		</div>
	</div>

	<div v-else-if="gameState === 'results'" class="_panel _gaps" :class="$style.card">
		<div :class="$style.resultHeading">
			<div :class="$style.resultIcon">
				<i :class="missedAnswers.length === 0 ? 'ti ti-trophy' : 'ti ti-school'"></i>
			</div>
			<div>
				<div :class="$style.kicker">FIM DA PARTIDA</div>
				<h2 style="margin: 4px 0;">{{ missedAnswers.length === 0 ? 'Perfeito! Todos os níveis concluídos.' : 'Partida concluída: hora de aprender com a revisão.' }}</h2>
				<p style="margin: 0;">Você acertou {{ correctCount }} de {{ questions.length }} perguntas.</p>
			</div>
		</div>

		<div :class="$style.scoreCards">
			<div :class="$style.scoreCard"><strong>{{ correctCount }}/{{ questions.length }}</strong><span>acertos</span></div>
			<div :class="$style.scoreCard"><strong>{{ missedAnswers.length }}</strong><span>{{ missedAnswers.length === 1 ? 'tema para rever' : 'temas para rever' }}</span></div>
			<div :class="$style.scoreCard"><strong>+{{ completionBonus }}</strong><span>pontos-bônus do jogo</span></div>
		</div>
		<p :class="$style.bonusNote">
			O bônus é uma recompensa didática por concluir a partida. Ele é separado do cálculo Elo,
			que você pode observar na aba Feed &amp; Simulação.
		</p>

		<div v-if="missedAnswers.length > 0" class="_gaps_s">
			<h3 style="margin: 0;">Vamos rever as respostas</h3>
			<article v-for="(missed, index) in missedAnswers" :key="missed.question.id" :class="$style.review">
				<div :class="$style.reviewHeading">Nível {{ missed.question.level }} · {{ missed.question.topic }} · questão {{ index + 1 }}</div>
				<p><strong>{{ missed.question.prompt }}</strong></p>
				<div :class="$style.yourAnswer"><i class="ti ti-x"></i> Sua resposta: {{ missed.selected }}</div>
				<div :class="$style.rightAnswer"><i class="ti ti-check"></i> Resposta correta: {{ missed.question.answer }}</div>
				<p>{{ missed.question.explanation }}</p>
			</article>
		</div>

		<div v-else :class="$style.perfectMessage">
			<i class="ti ti-sparkles"></i>
			<strong>Nenhum erro para revisar desta vez.</strong>
			<span>Uma nova tentativa sorteia outras perguntas para você continuar praticando.</span>
		</div>

		<div :class="$style.continueRow">
			<MkButton primary gradate large rounded @click="startGame">
				<i class="ti ti-refresh"></i> Jogar novamente com novas perguntas
			</MkButton>
			<MkButton rounded @click="gameState = 'intro'"><i class="ti ti-book-2"></i> Rever explicações</MkButton>
		</div>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import MkButton from '@/components/MkButton.vue';
import { createGameRound } from '@/utility/logic-sets-game.js';
import type { QuizQuestion } from '@/utility/logic-sets-game.js';

const props = defineProps<{
	eloRating: number;
}>();

const emit = defineEmits<{
	(event: 'completed', bonus: number): void;
}>();

const completionBonus = 10;

const lessons = [
	{
		title: '1. Teoria dos conjuntos',
		subtitle: 'Agrupe, compare e encontre elementos em comum.',
		icon: 'ti ti-chart-circles',
		description: 'Um conjunto é uma coleção de elementos. A união junta os elementos; a intersecção encontra o que é compartilhado; a diferença mantém o que está em um conjunto e não no outro.',
		example: 'A = {Ana, Bia} · B = {Bia, Caio} · A ∩ B = {Bia}',
		connection: 'Use os grupos de utilizadores para descobrir quem segue e também é seguido.',
	},
	{
		title: '2. Lógica matemática',
		subtitle: 'Transforme condições em verdadeiro ou falso.',
		icon: 'ti ti-binary-tree',
		description: 'Proposições são afirmações com valor verdadeiro (V) ou falso (F). A conjunção “E” exige que ambas sejam verdadeiras. A condicional “se p, então q” só falha no caso V → F.',
		example: 'Autenticado (V) → Conectado (F) = Falso',
		connection: 'Decida se as condições de uma regra de acesso ao feed foram satisfeitas.',
	},
	{
		title: '3. Vetores em R⁵',
		subtitle: 'Represente várias características com números.',
		icon: 'ti ti-vector',
		description: 'Um vetor é uma sequência ordenada de números. R⁵ indica cinco componentes reais; cada posição pode representar uma dimensão de preferência no exemplo educativo.',
		example: 'Preferências = [0.8, 0.2, 0.6, 0.5, 0.4] · são 5 dimensões',
		connection: 'Compare vetores de preferência e de conteúdo para calcular compatibilidade.',
	},
	{
		title: '4. Combinação linear',
		subtitle: 'Junte fatores com pesos diferentes.',
		icon: 'ti ti-math',
		description: 'Uma combinação linear multiplica cada valor pelo seu peso e depois soma as contribuições. O peso indica quanto aquele fator participa no resultado.',
		example: '0,4 × 10 + 0,6 × 20 = 4 + 12 = 16',
		connection: 'O jogo combina compatibilidade do utilizador, do conteúdo e Elo normalizado para ordenar emojis.',
	},
	{
		title: '5. Elo e simulação',
		subtitle: 'Atualize um rating a partir de expectativa e resultado.',
		icon: 'ti ti-chart-arrows-vertical',
		description: 'O Elo compara um rating com o de referência, estima o resultado esperado e ajusta a pontuação. Uma vitória inesperada costuma valer mais. Uma simulação é um modelo com hipóteses explícitas, não uma previsão perfeita.',
		example: 'R novo = R atual + K × (S − E) · ratings iguais + vitória, K = 16 → +8',
		connection: `No Feed, cada reação é um resultado favorável de demonstração contra o rating fictício de 1200. Rating atual: ${props.eloRating}.`,
	},
];

const gameState = ref<'intro' | 'playing' | 'results'>('intro');
const questions = ref<QuizQuestion[]>([]);
const currentIndex = ref(0);
const selectedAnswer = ref<string | null>(null);
const correctCount = ref(0);
const missedAnswers = ref<Array<{ question: QuizQuestion; selected: string }>>([]);
const previousQuestionIds = ref<string[]>([]);

const currentQuestion = computed(() => questions.value[currentIndex.value] ?? null);
const hasAnswered = computed(() => selectedAnswer.value !== null);

function startGame() {
	questions.value = createGameRound(Math.random, previousQuestionIds.value);
	previousQuestionIds.value = questions.value.map(question => question.id);
	currentIndex.value = 0;
	selectedAnswer.value = null;
	correctCount.value = 0;
	missedAnswers.value = [];
	gameState.value = 'playing';
}

function answerQuestion(option: string) {
	const question = currentQuestion.value;
	if (question == null || hasAnswered.value) return;

	selectedAnswer.value = option;
	if (option === question.answer) {
		correctCount.value++;
	} else {
		missedAnswers.value.push({ question, selected: option });
	}
}

function continueGame() {
	if (!hasAnswered.value) return;

	if (currentIndex.value + 1 < questions.value.length) {
		currentIndex.value++;
		selectedAnswer.value = null;
		return;
	}

	gameState.value = 'results';
	emit('completed', completionBonus);
}
</script>

<style lang="scss" module>
.card {
	padding: 20px;
	overflow: hidden;
}

.logo {
	display: block;
	width: min(100%, 680px);
	height: auto;
	margin: 0 auto;
	border-radius: 16px;
}

.intro {
	text-align: center;

	> p {
		max-width: 62ch;
		margin: 0 auto !important;
		line-height: 1.65;
		opacity: 0.78;
	}
}

.instructions {
	padding: 16px 18px;
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 12px;
	background: var(--MI_THEME-panelHighlight);

	> strong {
		font-size: 1.05em;
	}

	ol {
		margin: 10px 0 0;
		padding-left: 1.5em;
		line-height: 1.7;
	}
}

.lessons {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(min(100%, 270px), 1fr));
	gap: 10px;
}

.lesson {
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 12px;
	overflow: hidden;

	> summary {
		display: flex;
		align-items: center;
		gap: 12px;
		min-height: 72px;
		padding: 12px;
		cursor: pointer;
		list-style: none;

		&::-webkit-details-marker {
			display: none;
		}

		> span:nth-child(2) {
			display: grid;
			gap: 4px;
			flex: 1;
		}

		small {
			font-size: 0.84em;
			line-height: 1.4;
			opacity: 0.7;
		}
	}

	&[open] {
		border-color: var(--MI_THEME-accent);
	}
}

.lessonIcon {
	display: grid;
	place-items: center;
	flex: 0 0 38px;
	width: 38px;
	height: 38px;
	border-radius: 11px;
	background: var(--MI_THEME-accentedBg);
	color: var(--MI_THEME-accent);
	font-size: 1.25em;
}

.chevron {
	opacity: 0.55;
	transition: transform 0.15s ease;

	.lesson[open] & {
		transform: rotate(180deg);
	}
}

.lessonBody {
	padding: 0 14px 14px;
	line-height: 1.55;

	> p {
		margin: 0 0 10px;
	}
}

.example {
	padding: 10px 12px;
	overflow-wrap: anywhere;
	border-radius: 8px;
	background: var(--MI_THEME-panelHighlight);
	font-family: var(--MI_FONTFAMILY_MONOSPACE);
	font-size: 0.9em;
}

.lessonConnection {
	margin: 10px 0 0 !important;
	font-size: 0.9em;
	opacity: 0.76;
}

.ratingPreview {
	display: flex;
	gap: 14px;
	padding: 16px;
	border: 1px solid color-mix(in srgb, var(--MI_THEME-accent) 35%, transparent);
	border-radius: 12px;
	background: var(--MI_THEME-accentedBg);
	line-height: 1.55;

	p {
		margin: 8px 0;
	}

	code,
	small {
		display: block;
	}

	code {
		margin: 10px 0 4px;
		font-size: 1.05em;
		font-weight: 700;
	}

	small {
		opacity: 0.75;
	}
}

.startButton {
	width: 100%;
	justify-content: center;
	min-height: 52px;
}

.gameHeader,
.progressText,
.continueRow,
.resultHeading {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 12px;
}

.kicker,
.questionNumber {
	font-size: 0.76em;
	font-weight: 800;
	letter-spacing: 0.12em;
	color: var(--MI_THEME-accent);
}

.progressText {
	font-size: 0.9em;
	opacity: 0.75;
}

.progress {
	display: block;
	width: 100%;
	height: 9px;
	overflow: hidden;
	border: 0;
	border-radius: 99px;
	background: var(--MI_THEME-divider);
	accent-color: var(--MI_THEME-accent);

	&::-webkit-progress-bar {
		border-radius: 99px;
		background: var(--MI_THEME-divider);
	}

	&::-webkit-progress-value {
		border-radius: 99px;
		background: var(--MI_THEME-accent);
		transition: width 0.25s ease;
	}
}

.questionArea {
	display: grid;
	gap: 14px;
}

.question {
	margin: 0;
	font-size: 1.2em;
	font-weight: 650;
	line-height: 1.5;
}

.hint {
	border-radius: 8px;
	background: var(--MI_THEME-panelHighlight);

	> summary {
		padding: 10px 12px;
		cursor: pointer;
		color: var(--MI_THEME-accent);
	}

	> p {
		margin: 0;
		padding: 0 12px 12px;
		line-height: 1.5;
	}
}

.options {
	display: grid;
	gap: 10px;
}

.option {
	display: flex;
	align-items: center;
	justify-content: space-between;
	min-height: 52px;
	height: auto;
	padding: 12px 16px;
	text-align: left;
	white-space: normal;
	line-height: 1.45;
}

.feedback {
	padding: 14px 16px;
	border-radius: 10px;
	line-height: 1.6;

	> strong {
		display: block;
	}

	> p {
		margin: 6px 0 0;
	}
}

.correct {
	background: color-mix(in srgb, var(--MI_THEME-success) 12%, transparent);
	color: var(--MI_THEME-success);
}

.incorrect {
	background: var(--MI_THEME-infoBg);
	color: var(--MI_THEME-infoFg);
}

.continueRow {
	justify-content: flex-end;
	flex-wrap: wrap;
}

.resultHeading {
	justify-content: flex-start;

	p {
		opacity: 0.75;
	}
}

.resultIcon {
	display: grid;
	place-items: center;
	flex: 0 0 56px;
	width: 56px;
	height: 56px;
	border-radius: 16px;
	background: var(--MI_THEME-accentedBg);
	color: var(--MI_THEME-accent);
	font-size: 1.7em;
}

.scoreCards {
	display: grid;
	grid-template-columns: repeat(3, minmax(0, 1fr));
	gap: 10px;
}

.scoreCard {
	display: grid;
	justify-items: center;
	gap: 4px;
	padding: 14px 8px;
	border-radius: 10px;
	background: var(--MI_THEME-panelHighlight);
	text-align: center;

	strong {
		font-size: 1.4em;
		color: var(--MI_THEME-accent);
	}

	span {
		font-size: 0.82em;
		opacity: 0.75;
	}
}

.bonusNote {
	margin: 0;
	font-size: 0.88em;
	line-height: 1.5;
	opacity: 0.75;
}

.review {
	padding: 14px;
	border: 1px solid var(--MI_THEME-divider);
	border-radius: 10px;

	> p {
		margin: 10px 0;
		line-height: 1.5;
	}

	> p:last-child {
		margin-bottom: 0;
	}
}

.reviewHeading {
	font-size: 0.82em;
	font-weight: 700;
	color: var(--MI_THEME-accent);
}

.yourAnswer,
.rightAnswer {
	margin-top: 6px;
	line-height: 1.45;
}

.yourAnswer {
	color: var(--MI_THEME-error);
}

.rightAnswer {
	color: var(--MI_THEME-success);
}

.perfectMessage {
	display: grid;
	justify-items: center;
	gap: 8px;
	padding: 22px;
	border-radius: 12px;
	background: color-mix(in srgb, var(--MI_THEME-success) 12%, transparent);
	color: var(--MI_THEME-success);
	text-align: center;
	line-height: 1.5;

	> i {
		font-size: 1.8em;
	}
}

@media (max-width: 520px) {
	.card {
		padding: 14px;
	}

	.gameHeader {
		align-items: flex-start;
		flex-direction: column;
	}

	.scoreCards {
		grid-template-columns: 1fr;
	}
}
</style>
