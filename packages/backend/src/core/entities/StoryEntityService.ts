/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { StoriesRepository, StoryViewsRepository } from '@/models/_.js';
import type { MiUser } from '@/models/User.js';
import type { MiStory } from '@/models/Story.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '@/core/IdService.js';
import { UserEntityService } from './UserEntityService.js';
import { DriveFileEntityService } from './DriveFileEntityService.js';

@Injectable()
export class StoryEntityService {
	constructor(
		@Inject(DI.storiesRepository)
		private storiesRepository: StoriesRepository,

		@Inject(DI.storyViewsRepository)
		private storyViewsRepository: StoryViewsRepository,

		private userEntityService: UserEntityService,
		private driveFileEntityService: DriveFileEntityService,
		private idService: IdService,
	) {
	}

	@bindThis
	public async packMany(
		stories: MiStory[],
		me?: { id: MiUser['id'] } | null | undefined,
	) {
		if (stories.length === 0) return [];

		const viewedIds = me
			? new Set((await this.storyViewsRepository.find({
				where: { userId: me.id, storyId: In(stories.map(s => s.id)) },
				select: ['storyId'],
			})).map(v => v.storyId))
			: new Set<string>();

		const userMap = new Map((await this.userEntityService.packMany(
			stories.map(({ user, userId }) => user ?? userId), me,
		)).map(u => [u.id, u]));

		const fileMap = new Map((await this.driveFileEntityService.packManyByIds(
			[...new Set(stories.map(s => s.fileId).filter((id): id is string => id != null))],
		)).map(f => [f.id, f]));

		// story só com texto não tem arquivo; já com arquivo que sumiu do Drive, é descartado
		return stories
			.filter(story => userMap.has(story.userId) && (story.fileId == null || fileMap.has(story.fileId)))
			.map(story => ({
				id: story.id,
				createdAt: this.idService.parse(story.id).date.toISOString(),
				expiresAt: story.expiresAt.toISOString(),
				userId: story.userId,
				user: userMap.get(story.userId),
				file: story.fileId != null ? fileMap.get(story.fileId) ?? null : null,
				text: story.text,
				isViewed: viewedIds.has(story.id),
			}));
	}

	@bindThis
	public async pack(
		src: MiStory['id'] | MiStory,
		me?: { id: MiUser['id'] } | null | undefined,
	) {
		const story = typeof src === 'object' ? src : await this.storiesRepository.findOneByOrFail({ id: src });
		const packed = await this.packMany([story], me);
		return packed[0];
	}
}
