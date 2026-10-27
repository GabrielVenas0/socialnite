/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { afterEach, assert, describe, test, vi } from 'vitest';
import './init';
import { applyTheme } from '@/theme.js';
import type { Theme } from '@/theme.js';

// Reproduz o WebKit (todo navegador de iOS): quando uma transição de tela é
// abortada por outra, a promise `ready` rejeita com AbortError e o navegador
// NÃO a marca como tratada. O Chrome marca -- por isso o defeito só aparece
// no iPhone. No app real, a rejeição órfã cai no onunhandledrejection do
// boot.js e vira a tela "Falha ao carregar". Ver misskey-dev/misskey#16562.
function startViewTransitionDoWebKit(callback: () => Promise<void>) {
	const updateCallbackDone = Promise.resolve().then(callback);
	const ready = updateCallbackDone.then(() => {
		throw Object.assign(
			new Error('Old view transition aborted by new view transition.'),
			{ name: 'AbortError' },
		);
	});
	const finished = updateCallbackDone.then(() => undefined);
	return { updateCallbackDone, ready, finished, skipTransition: () => {} };
}

const tema = (id: string): Theme => ({ id, name: id, author: 'teste', base: 'dark', props: {} });

const esperar = () => new Promise((resolve) => setTimeout(resolve, 30));

describe('applyTheme', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		window.document.documentElement.classList.remove('_themeChanging_');
	});

	test('transição abortada não deixa rejeição órfã', async () => {
		vi.stubGlobal('document', Object.assign(window.document, {
			startViewTransition: startViewTransitionDoWebKit,
		}));

		const escapadas: unknown[] = [];
		const ouvir = (motivo: unknown) => escapadas.push(motivo);
		process.on('unhandledRejection', ouvir);
		try {
			// Primeira visita com o aparelho em modo escuro: o tema é aplicado
			// uma vez com o padrão do código e outra quando chega o tema da
			// instância. É a sequência que derrubava o boot no iOS.
			applyTheme(tema('padrao-do-codigo'), false);
			applyTheme(tema('padrao-da-instancia'), false);
			await esperar();
		} finally {
			process.off('unhandledRejection', ouvir);
		}

		assert.deepStrictEqual(escapadas, []);
	});

	test('a classe de transição é removida mesmo quando a transição é abortada', async () => {
		vi.stubGlobal('document', Object.assign(window.document, {
			startViewTransition: startViewTransitionDoWebKit,
		}));

		applyTheme(tema('outro-tema'), false);
		assert.ok(window.document.documentElement.classList.contains('_themeChanging_'));
		await esperar();
		assert.notOk(window.document.documentElement.classList.contains('_themeChanging_'));
	});
});
