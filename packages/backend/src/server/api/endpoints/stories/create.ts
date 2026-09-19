/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '@/server/api/error.js';
import type { DriveFilesRepository, StoriesRepository } from '@/models/_.js';
import type { MiDriveFile } from '@/models/DriveFile.js';
import { MiStory } from '@/models/Story.js';
import { IdService } from '@/core/IdService.js';
import { StoryEntityService } from '@/core/entities/StoryEntityService.js';
import { DI } from '@/di-symbols.js';

export const STORY_TTL_MS = 1000 * 60 * 60 * 24;

export const meta = {
	tags: ['stories'],

	requireCredential: true,

	prohibitMoved: true,

	kind: 'write:notes',

	limit: {
		duration: ms('1hour'),
		max: 20,
	},

	errors: {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: '8d4f9c2a-6b3e-4a1d-9f07-3c5b1e2a7d64',
		},

		invalidFileType: {
			message: 'Only images and videos can be used in a story.',
			code: 'INVALID_FILE_TYPE',
			id: 'e6b2d048-91c3-4f7a-b5d0-2a8f1c6e9d73',
		},

		emptyStory: {
			message: 'A story needs a text or a file.',
			code: 'EMPTY_STORY',
			id: 'a3f19c7e-52d8-4b6a-8e14-0d7c9b2f6a35',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		fileId: { type: 'string', format: 'misskey:id', nullable: true },
		text: { type: 'string', nullable: true, maxLength: 500 },
		// true: a mídia continua no Drive depois que o story expira; false: some junto com ele
		keepFile: { type: 'boolean', default: false },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.storiesRepository)
		private storiesRepository: StoriesRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private storyEntityService: StoryEntityService,
		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const text = ps.text?.trim() || null;

			if (ps.fileId == null && text == null) {
				throw new ApiError(meta.errors.emptyStory);
			}

			let file: MiDriveFile | null = null;

			if (ps.fileId != null) {
				file = await this.driveFilesRepository.findOneBy({
					id: ps.fileId,
					userId: me.id,
				});

				if (file == null) {
					throw new ApiError(meta.errors.noSuchFile);
				}

				if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
					throw new ApiError(meta.errors.invalidFileType);
				}
			}

			const story = await this.storiesRepository.insertOne(new MiStory({
				id: this.idService.gen(),
				userId: me.id,
				fileId: file?.id ?? null,
				text,
				keepFile: file != null && ps.keepFile,
				expiresAt: new Date(Date.now() + STORY_TTL_MS),
			}));

			return await this.storyEntityService.pack(story, me);
		});
	}
}
