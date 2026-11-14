/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Círculo Social: conectivos lógicos e tabela-verdade usados pelo jogo.

/** ¬ (não) */
export const negacao = (p: boolean): boolean => !p;
/** ∧ (e) */
export const conjuncao = (p: boolean, q: boolean): boolean => p && q;
/** ∨ (ou) */
export const disjuncao = (p: boolean, q: boolean): boolean => p || q;

/** As quatro combinações de p e q, na ordem usual da tabela-verdade. */
export const LINHAS: readonly (readonly [boolean, boolean])[] = [
	[true, true],
	[true, false],
	[false, true],
	[false, false],
];

export function tabelaVerdade(conectivo: (p: boolean, q: boolean) => boolean): boolean[] {
	return LINHAS.map(([p, q]) => conectivo(p, q));
}

export function vf(valor: boolean): 'V' | 'F' {
	return valor ? 'V' : 'F';
}

/** Linha da tabela que corresponde aos valores dados de p e q. */
export function linhaDe(p: boolean, q: boolean): number {
	return LINHAS.findIndex(([lp, lq]) => lp === p && lq === q);
}
