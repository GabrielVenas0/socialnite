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
