/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { ReversiGamesRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';

export const meta = {
	tags: ['reversi'],

	allowGet: true,
	cacheSec: 60,

	requireCredential: false,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 50, default: 10 },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.reversiGamesRepository)
		private reversiGamesRepository: ReversiGamesRepository,

		private userEntityService: UserEntityService,
	) {
		super(meta, paramDef, async (ps) => {
			const rows = await this.reversiGamesRepository.createQueryBuilder('game')
				.select('game.winnerId', 'userId')
				.addSelect('COUNT(*)', 'wins')
				.where('game.winnerId IS NOT NULL')
				.andWhere('game.isEnded = TRUE')
				.groupBy('game.winnerId')
				.orderBy('COUNT(*)', 'DESC')
				.limit(ps.limit)
				.getRawMany<{ userId: string; wins: string }>();

			if (rows.length === 0) return [];

			const users = await this.userEntityService.packMany(rows.map(r => r.userId), null);

			return rows.map(row => ({
				wins: Number(row.wins),
				user: users.find(u => u.id === row.userId),
			})).filter(row => row.user != null);
		});
	}
}
