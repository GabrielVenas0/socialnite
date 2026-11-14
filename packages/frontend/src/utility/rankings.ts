/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as Misskey from 'misskey-js';
import { misskeyApi } from '@/utility/misskey-api.js';

export type AchievementRankingRow = {
	count: number;
	user: Misskey.entities.UserLite;
};

export type ReversiRankingRow = {
	wins: number;
	user: Misskey.entities.UserLite;
};

// Endpoints do Social Nite, ausentes do autogen do misskey-js.
function call<T>(endpoint: string, data: Record<string, unknown> = {}): Promise<T> {
	return misskeyApi(endpoint as never, data as never) as Promise<T>;
}

export function fetchAchievementRanking(): Promise<AchievementRankingRow[]> {
	return call<AchievementRankingRow[]>('achievements/ranking');
}

export function fetchReversiRanking(): Promise<ReversiRankingRow[]> {
	return call<ReversiRankingRow[]>('reversi/ranking', { limit: 20 });
}

export type CirculoSocialRankingRow = {
	id: string;
	score: number;
	user: Misskey.entities.UserLite;
};

// O Círculo Social guarda as pontuações no registro do jogo das bolhas, com modo de jogo próprio.
export async function fetchCirculoSocialRanking(): Promise<CirculoSocialRankingRow[]> {
	const rows = await misskeyApi('bubble-game/ranking', { gameMode: 'circulo-social' });
	return rows.filter((r): r is CirculoSocialRankingRow => r.user != null);
}
