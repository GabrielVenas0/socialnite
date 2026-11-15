/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Círculo Social: operações de teoria dos conjuntos usadas pelo jogo.
// Os elementos são identificadores de contas.

export type Conjunto = ReadonlySet<string>;

/** As quatro regiões do diagrama de Venn de S (seguidores) e G (seguidos). */
export type Regiao = 's' | 'sg' | 'g' | 'fora';

export const REGIOES: readonly Regiao[] = ['s', 'sg', 'g', 'fora'];

export function pertence(x: string, a: Conjunto): boolean {
	return a.has(x);
}

/** A ⊂ B: todo elemento de A também está em B. */
export function contido(a: Conjunto, b: Conjunto): boolean {
	for (const x of a) if (!b.has(x)) return false;
	return true;
}

export function intersecao(a: Conjunto, b: Conjunto): Set<string> {
	return new Set([...a].filter(x => b.has(x)));
}

export function uniao(a: Conjunto, b: Conjunto): Set<string> {
	return new Set([...a, ...b]);
}

export function diferenca(a: Conjunto, b: Conjunto): Set<string> {
	return new Set([...a].filter(x => !b.has(x)));
}

/** A' em relação ao universo U. */
export function complementar(a: Conjunto, u: Conjunto): Set<string> {
	return diferenca(u, a);
}

/** Em qual região do diagrama de S e G o elemento fica. */
export function regiaoDe(x: string, s: Conjunto, g: Conjunto): Regiao {
	const emS = s.has(x);
	const emG = g.has(x);
	return emS && emG ? 'sg' : emS ? 's' : emG ? 'g' : 'fora';
}

/** Elementos de uma região, dentro do universo U. */
export function elementosDaRegiao(r: Regiao, s: Conjunto, g: Conjunto, u: Conjunto): Set<string> {
	return new Set([...u].filter(x => regiaoDe(x, s, g) === r));
}
