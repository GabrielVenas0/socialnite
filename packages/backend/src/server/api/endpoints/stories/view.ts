/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '@/server/api/error.js';
import type { StoriesRepository, StoryViewsRepository } from '@/models/_.js';
import { MiStoryView } from '@/models/StoryView.js';
import { IdService } from '@/core/IdService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['stories'],

	requireCredential: true,

	kind: 'write:account',

	errors: {
		noSuchStory: {
			message: 'No such story.',
			code: 'NO_SUCH_STORY',
			id: 'f2b1c7d4-9e83-4a52-b0c6-1d7e4f8a2b39',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		storyId: { type: 'string', format: 'misskey:id' },
	},
	required: ['storyId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.storiesRepository)
		private storiesRepository: StoriesRepository,

		@Inject(DI.storyViewsRepository)
		private storyViewsRepository: StoryViewsRepository,

		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const story = await this.storiesRepository.findOneBy({ id: ps.storyId });

			if (story == null) {
				throw new ApiError(meta.errors.noSuchStory);
			}

			// O índice único (storyId, userId) torna a segunda visualização inofensiva.
			await this.storyViewsRepository.insert(new MiStoryView({
				id: this.idService.gen(),
				storyId: story.id,
				userId: me.id,
			})).catch(() => { /* já visualizado */ });
		});
	}
}
