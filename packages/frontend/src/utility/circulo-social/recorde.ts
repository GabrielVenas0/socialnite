/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Círculo Social: recorde no aparelho e identificação no ranking.
// O ranking reaproveita os endpoints do jogo das bolhas (bubble-game/register
// e bubble-game/ranking), separado pelo modo de jogo abaixo.

import { miLocalStorage } from '@/local-storage.js';

export const MODO_DO_RANKING = 'circulo-social';
export const VERSAO_DO_JOGO = 1;

export function lerRecorde(): number {
	try {
		return Number(miLocalStorage.getItem('circuloSocialRecorde')) || 0;
	} catch {
		return 0;
	}
}

export function guardarRecorde(pontos: number): void {
	try {
		if (pontos > lerRecorde()) miLocalStorage.setItem('circuloSocialRecorde', String(pontos));
	} catch {
		// Sem armazenamento disponível (janela anônima, por exemplo): o recorde só não fica salvo.
	}
}
