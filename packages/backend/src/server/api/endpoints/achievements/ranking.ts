/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { FollowingsRepository, UserProfilesRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';

export const meta = {
	tags: ['users'],

	requireCredential: true,

	kind: 'read:account',
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private userEntityService: UserEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const followings = await this.followingsRepository.find({
				where: { followerId: me.id },
				select: ['followeeId'],
			});

			const userIds = [...new Set([me.id, ...followings.map(f => f.followeeId)])];

			const profiles = await this.userProfilesRepository.find({
				where: { userId: In(userIds) },
				select: ['userId', 'achievements'],
			});

			const users = await this.userEntityService.packMany(profiles.map(p => p.userId), me);

			return profiles
				.map(profile => ({
					count: profile.achievements.length,
					user: users.find(u => u.id === profile.userId),
				}))
				.filter(row => row.user != null)
				.sort((a, b) => b.count - a.count);
		});
	}
}
