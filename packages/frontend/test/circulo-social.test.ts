/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { assert, describe, test } from 'vitest';
import { complementar, contido, diferenca, intersecao, regiaoDe, uniao } from '@/utility/circulo-social/conjuntos.js';
import { conjuncao, disjuncao, linhaDe, tabelaVerdade } from '@/utility/circulo-social/logica.js';
import type { Rede } from '@/utility/circulo-social/dados.js';
import { redeFicticia, redeServe } from '@/utility/circulo-social/dados.js';
import type { RodadaEscolha, RodadaRegiao, RodadaTabela } from '@/utility/circulo-social/rodadas.js';
import { MAXIMO_TOTAL, estrelas, montarFases, pontosDaRodada } from '@/utility/circulo-social/rodadas.js';

/** Gerador pseudoaleatório com semente, para os testes serem repetíveis. */
function aleatorioComSemente(semente: number): () => number {
	let a = semente >>> 0;
	return () => {
		a = (a + 0x6D2B79F5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** Rede aleatória que respeita a regra do sistema: quem foi bloqueado não segue nem é seguido. */
function redeAleatoria(aleatorio: () => number, tamanho: number): Rede {
	const ids = Array.from({ length: tamanho }, (_, i) => `u${i}`);
	const S = new Set<string>();
	const G = new Set<string>();
	const M = new Set<string>();
	const B = new Set<string>();
	for (const id of ids) {
		const sorteio = aleatorio();
		if (sorteio < 0.1) {
			B.add(id);
			continue;
		}
		if (aleatorio() < 0.5) S.add(id);
		if (aleatorio() < 0.5) G.add(id);
		if (aleatorio() < 0.15) M.add(id);
	}
	const pessoas = new Map(ids.map(id => [id, { id, nome: `@${id}`, avatarUrl: null }]));
	const U = new Set([...S, ...G, ...M, ...B]);
	return { pessoas, S, G, M, B, U, ficticia: false };
}

function conferirFases(rede: Rede, semente: number) {
	const fases = montarFases(rede, aleatorioComSemente(semente));
	const { S, G, U } = rede;
	assert.equal(fases.length, 4);
	for (const fase of fases) {
		assert.equal(fase.rodadas.length, 6);
		for (const r of fase.rodadas) {
			const textos = JSON.stringify(r);
			assert.notInclude(textos, 'undefined', `texto com undefined: ${textos}`);
			assert.notInclude(textos, 'NaN', `texto com NaN: ${textos}`);
			if (r.tipo === 'escolha') {
				assert.isAtLeast(r.resposta, 0);
				assert.isBelow(r.resposta, r.opcoes.length);
				assert.equal(new Set(r.opcoes).size, r.opcoes.length, `opções repetidas: ${r.opcoes}`);
			}
		}
	}

	const [f1, f2, f3, f4] = fases;
	const escolha = (r: unknown) => r as RodadaEscolha;
	const regiao = (r: unknown) => r as RodadaRegiao;

	// Fase 1: a resposta bate com a pertinência real da pessoa sorteada.
	const r11 = escolha(f1.rodadas[0]);
	assert.equal(r11.resposta, S.has(r11.pessoa!) ? 0 : 1);
	assert.isTrue(S.has(escolha(f1.rodadas[1]).pessoa!));
	assert.isTrue(diferenca(G, S).has(escolha(f1.rodadas[2]).pessoa!));
	const r14 = escolha(f1.rodadas[3]);
	assert.equal(r14.resposta, G.has(r14.pessoa!) ? 0 : 1);

	// Fase 2: a região da pessoa e as regiões das operações.
	const r21 = regiao(f2.rodadas[0]);
	assert.deepEqual(r21.resposta, [regiaoDe(r21.pessoa!, S, G)]);
	assert.deepEqual(regiao(f2.rodadas[1]).resposta, ['sg']);
	assert.deepEqual(regiao(f2.rodadas[2]).resposta, ['s']);
	assert.deepEqual(regiao(f2.rodadas[3]).resposta, ['s', 'sg', 'g']);
	assert.deepEqual(regiao(f2.rodadas[4]).resposta, ['g', 'fora']);
	const r26 = escolha(f2.rodadas[5]);
	assert.equal(r26.opcoes[r26.resposta], String(uniao(S, G).size));

	// Fase 3: tabela de p ∧ q com a linha de quem segue sem ser seguido.
	const r36 = f3.rodadas[5] as RodadaTabela;
	assert.deepEqual(r36.resposta, [true, false, false, false]);
	assert.equal(r36.linha, 1);

	// Fase 4: o contraexemplo é alguém de G que não segue o jogador.
	const r45 = escolha(f4.rodadas[4]);
	const nomeCerto = r45.opcoes[r45.resposta];
	const idCerto = [...U].find(id => rede.pessoas.get(id)!.nome === nomeCerto)!;
	assert.isTrue(G.has(idCerto) && !S.has(idCerto));
	for (const [i, nome] of r45.opcoes.entries()) {
		if (i === r45.resposta) continue;
		const id = [...U].find(x => rede.pessoas.get(x)!.nome === nome)!;
		assert.isTrue(intersecao(S, G).has(id), 'opção errada deveria ser um amigo mútuo');
	}
}

describe('Círculo Social: conjuntos', () => {
	const { S, G, U } = redeFicticia();

	test('operações do exemplo da documentação', () => {
		assert.deepEqual([...intersecao(S, G)].sort(), ['ana', 'caio']);
		assert.deepEqual([...diferenca(S, G)], ['bia']);
		assert.deepEqual([...diferenca(G, S)], ['duda']);
		assert.equal(uniao(S, G).size, 4);
		assert.deepEqual([...complementar(S, U)].sort(), ['duda', 'edu', 'fabi']);
		assert.isTrue(contido(new Set(['ana', 'caio']), S));
		assert.isFalse(contido(new Set(['ana', 'duda']), S));
	});

	test('região de cada pessoa no diagrama', () => {
		assert.equal(regiaoDe('bia', S, G), 's');
		assert.equal(regiaoDe('ana', S, G), 'sg');
		assert.equal(regiaoDe('duda', S, G), 'g');
		assert.equal(regiaoDe('edu', S, G), 'fora');
	});
});

describe('Círculo Social: lógica', () => {
	test('tabelas-verdade de ∧ e ∨', () => {
		assert.deepEqual(tabelaVerdade(conjuncao), [true, false, false, false]);
		assert.deepEqual(tabelaVerdade(disjuncao), [true, true, true, false]);
		assert.equal(linhaDe(true, false), 1);
	});
});

describe('Círculo Social: rodadas', () => {
	test('pontuação e estrelas', () => {
		assert.equal(pontosDaRodada(0), 10);
		assert.equal(pontosDaRodada(5), 60);
		assert.equal(MAXIMO_TOTAL, 840);
		assert.equal(estrelas(210), 3);
		assert.equal(estrelas(180), 2);
		assert.equal(estrelas(120), 1);
	});

	test('a turma fictícia serve e gera rodadas coerentes', () => {
		const rede = redeFicticia();
		assert.isTrue(redeServe(rede));
		for (let semente = 1; semente <= 200; semente++) conferirFases(rede, semente);
	});

	test('redes aleatórias que servem geram rodadas coerentes', () => {
		const aleatorio = aleatorioComSemente(42);
		let testadas = 0;
		for (let i = 0; i < 2000 && testadas < 300; i++) {
			const rede = redeAleatoria(aleatorio, 3 + Math.floor(aleatorio() * 40));
			if (!redeServe(rede)) continue;
			conferirFases(rede, i + 1);
			testadas++;
		}
		assert.isAtLeast(testadas, 100);
	});

	test('as dicas mostram os conjuntos de que a rodada depende', () => {
		// No modo Turma fictícia o jogador não conhece a rede: a dica precisa dizer quem está em S e em G.
		const [f1, , f3, f4] = montarFases(redeFicticia(), aleatorioComSemente(7));
		for (const r of [f1.rodadas[1], f1.rodadas[2], f1.rodadas[4], f1.rodadas[5]]) {
			assert.include(r.dica, 'S = {');
		}
		for (const r of [f3.rodadas[2], f3.rodadas[3], f3.rodadas[4], f4.rodadas[2], f4.rodadas[4], f4.rodadas[5]]) {
			assert.include(r.dica, 'S = {');
			assert.include(r.dica, 'G = {');
		}
	});

	test('rede sem amigo mútuo não serve para o modo Minha rede', () => {
		const rede = redeFicticia();
		rede.G = new Set(['duda']);
		assert.isFalse(redeServe(rede));
	});
});
