/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export interface QuizQuestion {
	id: string;
	level: number;
	topic: string;
	prompt: string;
	options: string[];
	answer: string;
	hint: string;
	explanation: string;
}

export interface EloResult {
	expectedScore: number;
	delta: number;
	newRating: number;
}

const questionLevels: QuizQuestion[][] = [
	[
		{
			id: 'sets-intersection',
			level: 1,
			topic: 'Teoria dos conjuntos',
			prompt: 'U representa utilizadores ativos e P quem visualizou uma publicação. Qual operação seleciona quem pertence aos dois grupos?',
			options: ['União (U ∪ P)', 'Intersecção (U ∩ P)', 'Diferença (U − P)'],
			answer: 'Intersecção (U ∩ P)',
			hint: 'Pense em quem está simultaneamente em U e em P.',
			explanation: 'A intersecção reúne apenas os elementos que pertencem aos dois conjuntos. No exemplo, são os utilizadores ativos que viram a publicação.',
		},
		{
			id: 'sets-union',
			level: 1,
			topic: 'Teoria dos conjuntos',
			prompt: 'A união A ∪ B representa quais elementos?',
			options: ['Os elementos que estão em A ou em B, incluindo os que aparecem nos dois', 'Apenas os elementos comuns aos dois conjuntos', 'Apenas os elementos que estão fora dos dois conjuntos'],
			answer: 'Os elementos que estão em A ou em B, incluindo os que aparecem nos dois',
			hint: 'A união é como juntar as listas e eliminar repetições.',
			explanation: 'A união contém todo elemento que pertence a pelo menos um dos conjuntos. Um elemento compartilhado aparece uma única vez.',
		},
		{
			id: 'sets-difference',
			level: 1,
			topic: 'Teoria dos conjuntos',
			prompt: 'Se A = {1, 2, 3} e B = {3, 4}, qual é A − B?',
			options: ['{3}', '{1, 2}', '{1, 2, 3, 4}'],
			answer: '{1, 2}',
			hint: 'Comece por A e retire os elementos que também aparecem em B.',
			explanation: 'A diferença A − B mantém os elementos de A que não pertencem a B. O 3 é removido porque também está em B.',
		},
	],
	[
		{
			id: 'logic-conditional',
			level: 2,
			topic: 'Lógica matemática',
			prompt: 'Na condicional p → q, p é verdadeiro e q é falso. Qual é o resultado?',
			options: ['Verdadeiro', 'Falso', 'Não é possível determinar'],
			answer: 'Falso',
			hint: 'A condicional promete que, se p ocorrer, q também ocorrerá.',
			explanation: 'A condicional só é falsa no caso V → F: p aconteceu, mas q não. Nos outros três casos, ela é verdadeira.',
		},
		{
			id: 'logic-conjunction',
			level: 2,
			topic: 'Lógica matemática',
			prompt: 'Uma pessoa só acessa uma área se estiver autenticada E conectada. Como representamos esse “E” lógico?',
			options: ['Disjunção (p ∨ q)', 'Conjunção (p ∧ q)', 'Negação (¬p)'],
			answer: 'Conjunção (p ∧ q)',
			hint: 'A condição exige que as duas afirmações sejam verdadeiras ao mesmo tempo.',
			explanation: 'A conjunção p ∧ q é verdadeira somente quando p e q são verdadeiros. Um único requisito falso impede o acesso.',
		},
		{
			id: 'logic-negation',
			level: 2,
			topic: 'Lógica matemática',
			prompt: 'Se p significa “o utilizador está autenticado”, o que significa ¬p?',
			options: ['O utilizador está conectado', 'O utilizador não está autenticado', 'O utilizador está autenticado e conectado'],
			answer: 'O utilizador não está autenticado',
			hint: 'O símbolo ¬ inverte o valor lógico da afirmação.',
			explanation: 'A negação ¬p diz que p não é verdadeiro. Se p significa “está autenticado”, ¬p significa “não está autenticado”.',
		},
	],
	[
		{
			id: 'vectors-dimensions',
			level: 3,
			topic: 'Vetores e características',
			prompt: 'Neste simulador, uma preferência é representada pelo vetor [0.8, 0.2, 0.6, 0.5, 0.4]. Quantas características ele contém?',
			options: ['4', '5', '20'],
			answer: '5',
			hint: 'Conte os números dentro dos colchetes.',
			explanation: 'Cada número é uma componente do vetor. Há cinco componentes, por isso o vetor está em R⁵.',
		},
		{
			id: 'vectors-dot-product',
			level: 3,
			topic: 'Vetores e características',
			prompt: 'Qual é o produto escalar de [1, 2] · [3, 4]?',
			options: ['10', '11', '25'],
			answer: '11',
			hint: 'Multiplique as componentes correspondentes e some: (1 × 3) + (2 × 4).',
			explanation: 'O produto escalar é 1 × 3 + 2 × 4 = 3 + 8 = 11. No jogo, ele compara características correspondentes.',
		},
		{
			id: 'vectors-meaning',
			level: 3,
			topic: 'Vetores e características',
			prompt: 'O que as cinco componentes de um vetor de preferências podem representar?',
			options: ['Características numéricas diferentes da preferência', 'Cinco respostas certas do questionário', 'O nome e a senha do utilizador'],
			answer: 'Características numéricas diferentes da preferência',
			hint: 'Pense em como traduzir uma preferência para valores que um cálculo consiga comparar.',
			explanation: 'Um vetor transforma várias características em números ordenados. Os valores do jogo são didáticos, não dados pessoais nem um perfil real.',
		},
	],
	[
		{
			id: 'linear-weighted-sum',
			level: 4,
			topic: 'Combinação linear',
			prompt: 'Uma pontuação é calculada como 0,4 × 10 + 0,6 × 20. Qual é o resultado?',
			options: ['16', '14', '30'],
			answer: '16',
			hint: 'Calcule primeiro 0,4 × 10 e 0,6 × 20; depois some.',
			explanation: '0,4 × 10 = 4 e 0,6 × 20 = 12. A soma ponderada é 4 + 12 = 16.',
		},
		{
			id: 'linear-weights',
			level: 4,
			topic: 'Combinação linear',
			prompt: 'Na fórmula score = 0,4A + 0,6B, qual fator tem mais influência direta?',
			options: ['A, porque vem primeiro', 'B, porque tem o peso 0,6', 'Os dois sempre têm a mesma influência'],
			answer: 'B, porque tem o peso 0,6',
			hint: 'Compare os números que multiplicam A e B.',
			explanation: 'O peso 0,6 é maior que 0,4, então B contribui mais para o resultado quando A e B variam na mesma escala.',
		},
		{
			id: 'linear-recommendation',
			level: 4,
			topic: 'Combinação linear',
			prompt: 'No recomendador de emojis deste jogo, o score combina preferências, características da publicação e Elo normalizado. Que operação reúne essas contribuições ponderadas?',
			options: ['Combinação linear ponderada', 'Intersecção entre os vetores', 'Negação da publicação'],
			answer: 'Combinação linear ponderada',
			hint: 'Cada contribuição é multiplicada por um peso antes da soma.',
			explanation: 'Cada fator recebe um peso e as parcelas são somadas. Aqui o score didático é 0,4 × compatibilidade do utilizador + 0,4 × compatibilidade do post + 0,2 × Elo normalizado.',
		},
	],
	[
		{
			id: 'elo-equal-ratings',
			level: 5,
			topic: 'Elo e simulação',
			prompt: 'Dois participantes têm o mesmo rating Elo. Qual é a pontuação esperada de cada um antes de um resultado?',
			options: ['0%', '50%', '100%'],
			answer: '50%',
			hint: 'Ratings iguais significam probabilidades esperadas iguais.',
			explanation: 'Na fórmula Elo, ratings iguais dão E = 1 / (1 + 10⁰) = 0,5. Isso é uma expectativa, não uma garantia de resultado.',
		},
		{
			id: 'elo-update',
			level: 5,
			topic: 'Elo e simulação',
			prompt: 'Com K = 16, ratings iguais e uma vitória (S = 1), quanto o rating aumenta pela fórmula Rnovo = R + K × (S − E)?',
			options: ['4 pontos', '8 pontos', '16 pontos'],
			answer: '8 pontos',
			hint: 'Com ratings iguais, E = 0,5. Substitua esses valores na fórmula.',
			explanation: 'O aumento é 16 × (1 − 0,5) = 8. Quanto mais inesperada for a vitória, maior pode ser a mudança no Elo.',
		},
		{
			id: 'simulation-model',
			level: 5,
			topic: 'Elo e simulação',
			prompt: 'O que uma simulação matemática como esta representa?',
			options: ['Um modelo simplificado com regras explícitas para explorar uma ideia', 'Uma previsão perfeita de todas as interações reais', 'Um sistema sem entradas nem resultados'],
			answer: 'Um modelo simplificado com regras explícitas para explorar uma ideia',
			hint: 'Uma simulação ajuda a experimentar, mas depende das hipóteses que escolhemos.',
			explanation: 'O jogo torna conceitos observáveis com dados fictícios. O exemplo de rating não avalia utilizadores reais nem prevê o sucesso de publicações.',
		},
	],
];

function randomIndex(length: number, random: () => number): number {
	return Math.min(Math.floor(random() * length), length - 1);
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
	const result = [...items];

	for (let i = result.length - 1; i > 0; i--) {
		const j = randomIndex(i + 1, random);
		[result[i], result[j]] = [result[j], result[i]];
	}

	return result;
}

export function createGameRound(
	random: () => number = Math.random,
	previousQuestionIds: readonly string[] = [],
): QuizQuestion[] {
	return questionLevels.map(levelQuestions => {
		const newQuestions = levelQuestions.filter(question => !previousQuestionIds.includes(question.id));
		const choices = newQuestions.length > 0 ? newQuestions : levelQuestions;
		const question = choices[randomIndex(choices.length, random)];

		return {
			...question,
			options: shuffle(question.options, random),
		};
	});
}

export function calculateElo(
	rating: number,
	opponentRating: number,
	result: 0 | 0.5 | 1,
	kFactor = 16,
): EloResult {
	const expectedScore = 1 / (1 + 10 ** ((opponentRating - rating) / 400));
	const delta = Math.round(kFactor * (result - expectedScore));

	return {
		expectedScore,
		delta,
		newRating: rating + delta,
	};
}
