/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Círculo Social: de onde vêm os conjuntos do jogo.
// S = quem segue o jogador, G = quem ele segue, M = silenciados, B = bloqueados.

import { misskeyApi } from '@/utility/misskey-api.js';
import { diferenca, intersecao } from '@/utility/circulo-social/conjuntos.js';

export type Pessoa = {
	id: string;
	/** Como aparece no jogo, com @ na frente. */
	nome: string;
	avatarUrl: string | null;
};

export type Rede = {
	pessoas: Map<string, Pessoa>;
	S: Set<string>;
	G: Set<string>;
	M: Set<string>;
	B: Set<string>;
	/** U = S ∪ G ∪ M ∪ B */
	U: Set<string>;
	ficticia: boolean;
};

type Usuario = { id: string; username: string; host: string | null; avatarUrl: string | null };

function montarRede(pessoas: Map<string, Pessoa>, S: Set<string>, G: Set<string>, M: Set<string>, B: Set<string>, ficticia: boolean): Rede {
	return { pessoas, S, G, M, B, U: new Set([...S, ...G, ...M, ...B]), ficticia };
}

const NOMES_FICTICIOS = ['ana', 'bia', 'caio', 'duda', 'edu', 'fabi'];

/** A turma fictícia da documentação: S = {ana, bia, caio}, G = {ana, caio, duda}, M = {edu}, B = {fabi}. */
export function redeFicticia(): Rede {
	const pessoas = new Map<string, Pessoa>(NOMES_FICTICIOS.map(n => [n, { id: n, nome: `@${n}`, avatarUrl: null }]));
	return montarRede(pessoas, new Set(['ana', 'bia', 'caio']), new Set(['ana', 'caio', 'duda']), new Set(['edu']), new Set(['fabi']), true);
}

const LIMITE = 100;

/**
 * Lê todas as páginas de um endpoint. A leitura não é cortada no meio: um
 * seguidor que não fosse carregado pareceria, para o jogo, não ser seguidor.
 */
async function lerTudo<T extends { id: string }>(ler: (untilId?: string) => Promise<T[]>): Promise<T[]> {
	const todos: T[] = [];
	let untilId: string | undefined;
	for (;;) {
		const pagina = await ler(untilId);
		todos.push(...pagina);
		if (pagina.length < LIMITE) return todos;
		untilId = pagina[pagina.length - 1].id;
	}
}

/** Lê os quatro conjuntos da conta conectada. */
export async function lerMinhaRede(userId: string): Promise<Rede> {
	const pessoas = new Map<string, Pessoa>();
	const guardar = (u: Usuario | undefined | null): string | null => {
		if (u == null) return null;
		if (!pessoas.has(u.id)) {
			pessoas.set(u.id, { id: u.id, nome: u.host ? `@${u.username}@${u.host}` : `@${u.username}`, avatarUrl: u.avatarUrl });
		}
		return u.id;
	};
	const ids = (lista: (string | null)[]) => new Set(lista.filter((x): x is string => x != null));

	const [seguidores, seguidos, silenciados, bloqueados] = await Promise.all([
		lerTudo(untilId => misskeyApi('users/followers', { userId, limit: LIMITE, untilId })),
		lerTudo(untilId => misskeyApi('users/following', { userId, limit: LIMITE, untilId })),
		lerTudo(untilId => misskeyApi('mute/list', { limit: LIMITE, untilId })),
		lerTudo(untilId => misskeyApi('blocking/list', { limit: LIMITE, untilId })),
	]);

	return montarRede(
		pessoas,
		ids(seguidores.map(f => guardar(f.follower as Usuario | undefined))),
		ids(seguidos.map(f => guardar(f.followee as Usuario | undefined))),
		ids(silenciados.map(m => guardar(m.mutee as Usuario))),
		ids(bloqueados.map(b => guardar(b.blockee as Usuario))),
		false,
	);
}

/**
 * O modo Minha rede só funciona se houver pelo menos um amigo mútuo (S ∩ G),
 * um seguidor que o jogador não segue (S − G) e alguém que ele segue sem ser
 * seguido (G − S). Sem isso, várias rodadas ficariam sem resposta.
 */
export function redeServe(rede: Rede): boolean {
	return intersecao(rede.S, rede.G).size > 0 && diferenca(rede.S, rede.G).size > 0 && diferenca(rede.G, rede.S).size > 0;
}
