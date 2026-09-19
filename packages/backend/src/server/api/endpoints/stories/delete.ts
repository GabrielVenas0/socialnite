/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '@/server/api/error.js';
import type { StoriesRepository } from '@/models/_.js';
import { StoryService } from '@/core/StoryService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['stories'],

	requireCredential: true,

	kind: 'write:notes',

	errors: {
		noSuchStory: {
			message: 'No such story.',
			code: 'NO_SUCH_STORY',
			id: 'c1a5e7b2-4d39-4f80-a6e2-7b93c4d15e0a',
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

		private storyService: StoryService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const story = await this.storiesRepository.findOneBy({
				id: ps.storyId,
				userId: me.id,
			});

			if (story == null) {
				throw new ApiError(meta.errors.noSuchStory);
			}

			await this.storyService.remove([story]);
		});
	}
}
