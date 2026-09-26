/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Brackets } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { StoriesRepository } from '@/models/_.js';
import { StoryEntityService } from '@/core/entities/StoryEntityService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['stories'],

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
		@Inject(DI.storiesRepository)
		private storiesRepository: StoriesRepository,

		private storyEntityService: StoryEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Os seus, os de quem você segue e os de quem tem o perfil aberto.
			const stories = await this.storiesRepository.createQueryBuilder('story')
				.innerJoinAndSelect('story.user', 'user')
				.where('story.expiresAt > :now', { now: new Date() })
				.andWhere('user.isSuspended = FALSE')
				.andWhere(new Brackets(qb => {
					qb.where('story.userId = :meId', { meId: me.id })
						.orWhere('user.isLocked = FALSE')
						.orWhere('story.userId IN (SELECT "followeeId" FROM "following" WHERE "followerId" = :meId)', { meId: me.id });
				}))
				.orderBy('story.id', 'ASC')
				.take(500)
				.getMany();

			const packed = await this.storyEntityService.packMany(stories, me);

			// Um círculo por autor, com o próprio usuário sempre na frente e os
			// não visualizados antes dos já vistos.
			const groups = new Map<string, { user: unknown; stories: typeof packed; hasUnviewed: boolean }>();

			for (const story of packed) {
				let group = groups.get(story.userId);
				if (group == null) {
					group = { user: story.user, stories: [], hasUnviewed: false };
					groups.set(story.userId, group);
				}
				group.stories.push(story);
				if (!story.isViewed) group.hasUnviewed = true;
			}

			return [...groups.values()].sort((a, b) => {
				const aIsMe = a.stories[0].userId === me.id;
				const bIsMe = b.stories[0].userId === me.id;
				if (aIsMe !== bIsMe) return aIsMe ? -1 : 1;
				if (a.hasUnviewed !== b.hasUnviewed) return a.hasUnviewed ? -1 : 1;
				return b.stories[0].id.localeCompare(a.stories[0].id);
			});
		});
	}
}
