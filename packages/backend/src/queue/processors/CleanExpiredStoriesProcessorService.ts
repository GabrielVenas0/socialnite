/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import type Logger from '@/logger.js';
import { bindThis } from '@/decorators.js';
import { StoryService } from '@/core/StoryService.js';
import { QueueLoggerService } from '../QueueLoggerService.js';

@Injectable()
export class CleanExpiredStoriesProcessorService {
	private logger: Logger;

	constructor(
		private storyService: StoryService,
		private queueLoggerService: QueueLoggerService,
	) {
		this.logger = this.queueLoggerService.logger.createSubLogger('clean-expired-stories');
	}

	@bindThis
	public async process(): Promise<void> {
		this.logger.info('Cleaning expired stories...');

		const count = await this.storyService.cleanupExpired();

		this.logger.succ(`Cleaned ${count} expired stories.`);
	}
}
