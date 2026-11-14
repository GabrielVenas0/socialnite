/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Círculo Social: monta as quatro fases e as 24 rodadas a partir da rede do
// jogador. Cada fase vai da rodada mais fácil (1) para a mais difícil (6).
// O sorteio segue o quadro "Sorteio das contas" da documentação do jogo.

import type { Rede } from '@/utility/circulo-social/dados.js';
import type { Conjunto, Regiao } from '@/utility/circulo-social/conjuntos.js';
import { REGIOES, diferenca, elementosDaRegiao, intersecao, uniao } from '@/utility/circulo-social/conjuntos.js';
import { conjuncao, linhaDe, tabelaVerdade } from '@/utility/circulo-social/logica.js';

export type RodadaEscolha = {
	tipo: 'escolha';
	pergunta: string;
	dica: string;
	opcoes: string[];
	resposta: number;
	explicacao: string;
	/** Conta mostrada junto da pergunta. */
	pessoa?: string;
};

export type RodadaRegiao = {
	tipo: 'regiao';
	pergunta: string;
	dica: string;
	/** Regiões que formam a resposta. Mais de uma pede o botão Confirmar. */
	resposta: Regiao[];
	explicacao: string;
	pessoa?: string;
};

export type RodadaTabela = {
	tipo: 'tabela';
	pergunta: string;
	dica: string;
	p: string;
	q: string;
	resposta: boolean[];
	/** Linha da tabela que corresponde a uma conta real. */
	linha: number;
	rotuloLinha: string;
	explicacao: string;
};

export type Rodada = RodadaEscolha | RodadaRegiao | RodadaTabela;

export type Simbolo = { simbolo: string; nome: string; descricao: string };

export type Fase = {
	titulo: string;
	simbolos: Simbolo[];
	nota: string;
	rodadas: Rodada[];
};

export const RODADAS_POR_FASE = 6;
/** A rodada n (de 1 a 6) vale 10 × n pontos. */
export const pontosDaRodada = (indice: number): number => 10 * (indice + 1);
export const MAXIMO_POR_FASE = 210;
export const MAXIMO_TOTAL = 4 * MAXIMO_POR_FASE;

export function estrelas(pontos: number): 1 | 2 | 3 {
	return pontos >= 190 ? 3 : pontos >= 130 ? 2 : 1;
}

export function montarFases(rede: Rede, aleatorio: () => number = Math.random): Fase[] {
	const { S, G, M, B, U } = rede;
	const SG = intersecao(S, G);
	const SmG = diferenca(S, G);
	const GmS = diferenca(G, S);
	const SuG = uniao(S, G);

	const sortear = (c: Conjunto): string => {
		const a = [...c];
		return a[Math.floor(aleatorio() * a.length)];
	};
	const embaralhar = <T>(xs: T[]): T[] => {
		const a = [...xs];
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(aleatorio() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	};
	const nome = (id: string): string => rede.pessoas.get(id)?.nome ?? id;
	const curto = (id: string): string => nome(id).replace(/^@/, '');
	/** {ana, bia, caio}, com no máximo seis nomes. */
	const lista = (c: Conjunto, max = 6): string => {
		const nomes = [...c].map(curto);
		if (nomes.length === 0) return '∅';
		const resto = nomes.length > max ? `, … e mais ${nomes.length - max}` : '';
		return `{${nomes.slice(0, max).join(', ')}${resto}}`;
	};
	const motivo = (id: string): string => (M.has(id) ? ' (está silenciado)' : B.has(id) ? ' (está bloqueado)' : '');
	const indiceDe = <T>(xs: T[], x: T): number => xs.indexOf(x);
	// As rodadas que dependem de saber quem segue quem mostram os conjuntos na dica:
	// sem isso, no modo Turma fictícia não há como descobrir a resposta.
	const redeEmPalavras = `Quem te segue: S = ${lista(S)}. Quem você segue: G = ${lista(G)}.`;

	// ---------------- Fase 1: pertence ou não? ----------------
	const dicaPertence = `∈ = pertence (está dentro); ∉ = não pertence (está fora). S = ${lista(S)}.`;
	const dicaContido = `⊂ = está contido: todos do grupo estão dentro de S. ⊄ = não está contido: pelo menos um está fora. S = ${lista(S)}.`;

	const f1r1 = aleatorio() < 0.5 ? sortear(S) : sortear(GmS);
	const f1r2 = sortear(S);
	const f1r3 = sortear(GmS);
	const f1r4 = aleatorio() < 0.5 ? sortear(G) : sortear(diferenca(U, G));
	const [f1r5a, f1r5b] = embaralhar([...S]).slice(0, 2);
	const f1r6dentro = sortear(S);
	const f1r6fora = sortear(diferenca(U, S));
	const f1r6 = embaralhar([f1r6dentro, f1r6fora]);

	const fase1: Fase = {
		titulo: 'Pertence ou não?',
		simbolos: [
			{ simbolo: '∈', nome: 'pertence', descricao: 'a pessoa está dentro do conjunto' },
			{ simbolo: '∉', nome: 'não pertence', descricao: 'a pessoa está fora do conjunto' },
			{ simbolo: '⊂', nome: 'está contido', descricao: 'o grupo todo está dentro do conjunto' },
			{ simbolo: '⊄', nome: 'não está contido', descricao: 'alguém do grupo está fora' },
		],
		nota: '∈ e ∉ comparam uma pessoa com um conjunto. ⊂ e ⊄ comparam um grupo com um conjunto.',
		rodadas: [
			{
				tipo: 'escolha', pessoa: f1r1,
				pergunta: `${nome(f1r1)} te segue?`,
				dica: `S é o conjunto de quem te segue: S = ${lista(S)}.`,
				opcoes: ['Sim', 'Não'], resposta: S.has(f1r1) ? 0 : 1,
				explicacao: S.has(f1r1)
					? `${nome(f1r1)} está na lista S. Em matemática, isso se escreve ${nome(f1r1)} ∈ S, que se lê “pertence a S”.`
					: `${nome(f1r1)} não está na lista S. Em matemática, isso se escreve ${nome(f1r1)} ∉ S, que se lê “não pertence a S”.`,
			},
			{
				tipo: 'escolha', pessoa: f1r2,
				pergunta: `${nome(f1r2)} ___ S`, dica: dicaPertence,
				opcoes: ['∈', '∉'], resposta: 0,
				explicacao: `${nome(f1r2)} te segue, então está dentro de S: ${nome(f1r2)} ∈ S.`,
			},
			{
				tipo: 'escolha', pessoa: f1r3,
				pergunta: `${nome(f1r3)} ___ S`, dica: dicaPertence,
				opcoes: ['∈', '∉'], resposta: 1,
				explicacao: `Você segue ${nome(f1r3)}, mas ${nome(f1r3)} não te segue. Fica fora de S: ${nome(f1r3)} ∉ S.`,
			},
			{
				tipo: 'escolha', pessoa: f1r4,
				pergunta: `${nome(f1r4)} ___ G`,
				dica: `Agora o conjunto mudou. G é quem você segue: G = ${lista(G)}.`,
				opcoes: ['∈', '∉'], resposta: G.has(f1r4) ? 0 : 1,
				explicacao: G.has(f1r4)
					? `Você segue ${nome(f1r4)}, então ${nome(f1r4)} ∈ G.`
					: `${nome(f1r4)} não está na lista de quem você segue${motivo(f1r4)}. Então ${nome(f1r4)} ∉ G.`,
			},
			{
				tipo: 'escolha',
				pergunta: `{${curto(f1r5a)}, ${curto(f1r5b)}} ___ S`, dica: dicaContido,
				opcoes: ['⊂', '⊄'], resposta: 0,
				explicacao: `${nome(f1r5a)} e ${nome(f1r5b)} estão os dois em S. Quando todo o grupo está em S, ele está contido em S: {${curto(f1r5a)}, ${curto(f1r5b)}} ⊂ S.`,
			},
			{
				tipo: 'escolha',
				pergunta: `{${curto(f1r6[0])}, ${curto(f1r6[1])}} ___ S`, dica: dicaContido,
				opcoes: ['⊂', '⊄'], resposta: 1,
				explicacao: `${nome(f1r6dentro)} está em S, mas ${nome(f1r6fora)} não. Basta uma pessoa de fora para o grupo não estar contido: {${curto(f1r6[0])}, ${curto(f1r6[1])}} ⊄ S.`,
			},
		],
	};

	// ---------------- Fase 2: círculos ----------------
	const regioesComGente = REGIOES.filter(r => elementosDaRegiao(r, S, G, U).size > 0);
	const f2regiao = regioesComGente[Math.floor(aleatorio() * regioesComGente.length)];
	const f2x = sortear(elementosDaRegiao(f2regiao, S, G, U));
	const ondeFica: Record<Regiao, { dica: string; explicacao: string }> = {
		s: {
			dica: `${nome(f2x)} te segue (está em S), mas você não segue de volta (não está em G).`,
			explicacao: 'Está em S e fora de G, então fica na parte só do círculo S.',
		},
		sg: {
			dica: `${nome(f2x)} te segue e você segue de volta: está em S e em G.`,
			explicacao: 'Está nos dois círculos, então fica no pedaço onde eles se cruzam: a interseção.',
		},
		g: {
			dica: `Você segue ${nome(f2x)}, mas ${nome(f2x)} não te segue: está em G e fora de S.`,
			explicacao: 'Está em G e fora de S, então fica na parte só do círculo G.',
		},
		fora: {
			dica: `${nome(f2x)} não te segue e você não segue${motivo(f2x)}: está no jogo, mas fora dos dois círculos.`,
			explicacao: 'Não está em S nem em G, então fica fora dos círculos, mas dentro do retângulo U.',
		},
	};

	const nSuG = SuG.size;
	const somaErrada = S.size + G.size;
	const terceira = nSuG + 1 !== somaErrada ? nSuG + 1 : nSuG > 1 ? nSuG - 1 : nSuG + 2;
	const f2r6opcoes = embaralhar([nSuG, somaErrada, terceira]).map(String);

	const fase2: Fase = {
		titulo: 'Círculos',
		simbolos: [
			{ simbolo: '∩', nome: 'interseção', descricao: 'está nos dois círculos ao mesmo tempo (e)' },
			{ simbolo: '∪', nome: 'união', descricao: 'está em pelo menos um dos círculos (ou)' },
			{ simbolo: '−', nome: 'diferença', descricao: 'está no primeiro e não está no segundo' },
			{ simbolo: 'S\'', nome: 'complementar de S', descricao: 'está no jogo, mas fora de S' },
		],
		nota: 'U é o retângulo: todas as pessoas do jogo (quem te segue, quem você segue, silenciados e bloqueados).',
		rodadas: [
			{
				tipo: 'regiao', pessoa: f2x,
				pergunta: `Onde fica ${nome(f2x)}?`,
				dica: `${ondeFica[f2regiao].dica} Toque na parte do desenho onde fica.`,
				resposta: [f2regiao], explicacao: ondeFica[f2regiao].explicacao,
			},
			{
				tipo: 'regiao', pergunta: 'Toque em S ∩ G',
				dica: '∩ (interseção) = quem está nos dois círculos: te segue e você segue.',
				resposta: ['sg'],
				explicacao: `A interseção é o pedaço onde os círculos se cruzam: S ∩ G = ${lista(SG)}. São os amigos mútuos.`,
			},
			{
				tipo: 'regiao', pergunta: 'Toque em S − G',
				dica: '− (diferença) = quem está em S, mas não está em G: te segue, mas você não segue de volta.',
				resposta: ['s'],
				explicacao: `S − G = ${lista(SmG)}. É o círculo S sem o pedaço que ele divide com G.`,
			},
			{
				tipo: 'regiao', pergunta: 'Toque em S ∪ G',
				dica: '∪ (união) = quem está em pelo menos um dos círculos. Pode tocar em mais de uma parte e depois em Confirmar.',
				resposta: ['s', 'sg', 'g'],
				explicacao: `A união junta os dois círculos inteiros: S ∪ G = ${lista(SuG)}.`,
			},
			{
				tipo: 'regiao', pergunta: 'Toque em S\'',
				dica: 'S\' (complementar de S) = quem está no jogo (U), mas fora do círculo S. Pode tocar em mais de uma parte.',
				resposta: ['g', 'fora'],
				explicacao: `S' = ${lista(diferenca(U, S))}: todo mundo do jogo que não te segue. Inclui a parte só do G e a parte de fora dos círculos.`,
			},
			{
				tipo: 'escolha', pergunta: 'Quantas pessoas há em S ∪ G?',
				dica: `S tem ${S.size} pessoas, G tem ${G.size} e S ∩ G tem ${SG.size}. Cuidado para não contar ninguém duas vezes.`,
				opcoes: f2r6opcoes, resposta: indiceDe(f2r6opcoes, String(nSuG)),
				explicacao: `Somando ${S.size} + ${G.size} = ${somaErrada}, quem está em S ∩ G é contado duas vezes. Tirando a interseção: ${S.size} + ${G.size} − ${SG.size} = ${nSuG}.`,
			},
		],
	};

	// ---------------- Fase 3: verdadeiro ou falso? ----------------
	const f3x = sortear(SmG);
	const f3y = sortear(GmS);
	const f3a = sortear(S);
	const declarativa = `“${nome(f3a)} te segue.”`;
	const f3r1opcoes = embaralhar([declarativa, `“Siga ${nome(f3a)}!”`, `“Será que ${nome(f3a)} te segue?”`]);

	const fase3: Fase = {
		titulo: 'Verdadeiro ou falso?',
		simbolos: [
			{ simbolo: 'V F', nome: 'proposição', descricao: 'frase que pode ser verdadeira ou falsa' },
			{ simbolo: '¬', nome: 'não', descricao: 'troca o valor: V vira F e F vira V' },
			{ simbolo: '∧', nome: 'e', descricao: 'só é V se as duas partes forem V' },
			{ simbolo: '∨', nome: 'ou', descricao: 'é V se pelo menos uma parte for V' },
		],
		nota: 'V = verdadeiro, F = falso. p e q são nomes curtos para proposições.',
		rodadas: [
			{
				tipo: 'escolha', pergunta: 'Qual destas é uma proposição?',
				dica: 'Proposição = frase que dá para dizer se é verdadeira (V) ou falsa (F). Ordens e perguntas não são.',
				opcoes: f3r1opcoes, resposta: indiceDe(f3r1opcoes, declarativa),
				explicacao: `${declarativa} dá para conferir: é V. A ordem e a pergunta não são verdadeiras nem falsas; são só frases.`,
			},
			{
				tipo: 'escolha', pergunta: `p = “${nome(f3x)} te segue” é V. Quanto vale ¬p?`,
				dica: `¬ (não) troca o valor: V vira F e F vira V. ¬p = “${nome(f3x)} não te segue”.`,
				opcoes: ['V', 'F'], resposta: 1,
				explicacao: `Como p é V, ¬p é F. ${nome(f3x)} te segue, então “${nome(f3x)} não te segue” é falso.`,
			},
			{
				tipo: 'escolha', pergunta: `“${nome(f3x)} te segue ∧ você segue ${nome(f3x)}”`,
				dica: `∧ (e) só é V quando as duas partes são V. ${redeEmPalavras}`,
				opcoes: ['V', 'F'], resposta: 1,
				explicacao: `A primeira parte é V, mas a segunda é F: você não segue ${nome(f3x)}. Com ∧, basta uma parte F para tudo ser F.`,
			},
			{
				tipo: 'escolha', pergunta: `“${nome(f3x)} te segue ∨ você segue ${nome(f3x)}”`,
				dica: `∨ (ou) é V quando pelo menos uma parte é V. ${redeEmPalavras}`,
				opcoes: ['V', 'F'], resposta: 0,
				explicacao: 'A primeira parte já é V. Com ∨, uma parte V basta.',
			},
			{
				tipo: 'escolha', pergunta: `“${nome(f3y)} te segue ∨ você segue ${nome(f3x)}”`,
				dica: `Confira as duas partes. ${redeEmPalavras}`,
				opcoes: ['V', 'F'], resposta: 1,
				explicacao: `${nome(f3y)} não te segue (F) e você não segue ${nome(f3x)} (F). O ∨ só é F quando as duas partes são F, que é exatamente este caso.`,
			},
			{
				// espaços que não quebram: no celular "p ∧ q" desce inteiro para a linha de baixo
				tipo: 'tabela', pergunta: 'Complete a tabela-verdade de p ∧ q',
				p: `“${nome(f3x)} te segue”`, q: `“Você segue ${nome(f3x)}”`,
				dica: `Toque em cada ? para escolher V ou F. A linha destacada é a de ${nome(f3x)}.`,
				resposta: tabelaVerdade(conjuncao), linha: linhaDe(true, false), rotuloLinha: nome(f3x),
				explicacao: `O ∧ só dá V na primeira linha, quando p e q são V. Na linha de ${nome(f3x)} (p V, q F), p ∧ q é F, como na rodada 3.`,
			},
		],
	};

	// ---------------- Fase 4: todos ou algum? ----------------
	const f4a = sortear(SG);
	const f4y = sortear(GmS);
	const f4r5opcoes = embaralhar([f4y, ...embaralhar([...SG]).slice(0, 2)]).map(nome);

	const fase4: Fase = {
		titulo: 'Todos ou algum?',
		simbolos: [
			{ simbolo: 'x', nome: 'sentença aberta', descricao: 'frase com um espaço vazio: “x te segue”' },
			{ simbolo: '∀', nome: 'para todo', descricao: 'todas as pessoas, sem exceção' },
			{ simbolo: '∃', nome: 'existe', descricao: 'pelo menos uma pessoa' },
		],
		nota: 'Os quantificadores dizem para quantas pessoas a frase vale: todas ou pelo menos uma.',
		rodadas: [
			{
				tipo: 'escolha', pergunta: '“x te segue” é V ou F?',
				dica: 'x é um espaço vazio, como em “fulano te segue”. Frase com x se chama sentença aberta.',
				opcoes: ['V', 'F', 'Depende de quem é o x'], resposta: 2,
				explicacao: `Só dá para saber trocando o x por alguém. Com x = ${nome(f4a)}, fica V; com x = ${nome(f4y)}, fica F.`,
			},
			{
				tipo: 'escolha', pessoa: f4y,
				pergunta: `Troque o x por ${nome(f4y)}: “${nome(f4y)} te segue”`,
				dica: `S = ${lista(S)}.`,
				opcoes: ['V', 'F'], resposta: 1,
				explicacao: `${nome(f4y)} não está em S. Trocando o x, a sentença aberta virou uma proposição F.`,
			},
			{
				tipo: 'escolha', pergunta: '∃ pessoa em G que te segue',
				dica: `∃ (existe) = pelo menos uma pessoa. ${redeEmPalavras}`,
				opcoes: ['V', 'F'], resposta: 0,
				explicacao: `Existe, sim: ${nome(f4a)} te segue. Para o ∃ ser V, basta achar uma.`,
			},
			{
				tipo: 'escolha', pergunta: '∀ pessoa em S ∩ G te segue',
				dica: `∀ (para todo) = todas, sem exceção. S ∩ G = ${lista(SG)}.`,
				opcoes: ['V', 'F'], resposta: 0,
				explicacao: 'Todo mundo em S ∩ G te segue, porque S ∩ G fica dentro de S. Todos cumprem, então é V.',
			},
			{
				tipo: 'escolha', pergunta: '“∀ pessoa em G te segue” é falso. Quem prova isso?',
				dica: `Toque em quem quebra a regra. Essa pessoa se chama contraexemplo. ${redeEmPalavras}`,
				opcoes: f4r5opcoes, resposta: indiceDe(f4r5opcoes, nome(f4y)),
				explicacao: `${nome(f4y)} está em G e não te segue. Para derrubar um ∀, basta um contraexemplo.`,
			},
			{
				tipo: 'escolha', pergunta: '___ pessoa em G te segue',
				dica: `Qual símbolo deixa a frase verdadeira? ${redeEmPalavras}`,
				opcoes: ['∀', '∃'], resposta: 1,
				explicacao: `Nem todo mundo de G te segue (${nome(f4y)} não segue), então ∀ deixa a frase F. Mas existe pelo menos uma pessoa que segue, então ∃ deixa a frase V.`,
			},
		],
	};

	return [fase1, fase2, fase3, fase4];
}
