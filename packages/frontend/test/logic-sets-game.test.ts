/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { assert, describe, test } from 'vitest';
import { calculateElo, createGameRound } from '@/utility/logic-sets-game.js';

describe('Logic & Sets Challenge', () => {
	test('sorteia uma pergunta de cada nível com a resposta entre as opções', () => {
		const round = createGameRound(() => 0);

		assert.equal(round.length, 5);
		assert.deepEqual(round.map(question => question.level), [1, 2, 3, 4, 5]);
		for (const question of round) {
			assert.include(question.options, question.answer);
			assert.equal(new Set(question.options).size, question.options.length);
		}
	});

	test('evita repetir as perguntas da tentativa anterior quando há alternativas', () => {
		const firstRound = createGameRound(() => 0);
		const nextRound = createGameRound(() => 0, firstRound.map(question => question.id));

		assert.equal(nextRound.length, firstRound.length);
		for (const [index, question] of nextRound.entries()) {
			assert.notEqual(question.id, firstRound[index].id);
			assert.equal(question.level, firstRound[index].level);
		}
	});
});

describe('Simulação Elo', () => {
	test('ratings iguais têm expectativa de 50% e vitória soma metade de K', () => {
		const result = calculateElo(1200, 1200, 1);

		assert.equal(result.expectedScore, 0.5);
		assert.equal(result.delta, 8);
		assert.equal(result.newRating, 1208);
	});

	test('vitória menos esperada vale mais do que uma vitória contra rating menor', () => {
		const upset = calculateElo(1200, 1600, 1);
		const expectedWin = calculateElo(1600, 1200, 1);

		assert.isBelow(upset.expectedScore, 0.5);
		assert.isAbove(upset.delta, expectedWin.delta);
	});
});
