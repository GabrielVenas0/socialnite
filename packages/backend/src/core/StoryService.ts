/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { LessThan } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { DriveFilesRepository, NotesRepository, StoriesRepository } from '@/models/_.js';
import type { MiStory } from '@/models/Story.js';
import type Logger from '@/logger.js';
import { bindThis } from '@/decorators.js';
import { DriveService } from '@/core/DriveService.js';
import { LoggerService } from '@/core/LoggerService.js';

const CLEANUP_BATCH_SIZE = 100;

@Injectable()
export class StoryService {
	private logger: Logger;

	constructor(
		@Inject(DI.storiesRepository)
		private storiesRepository: StoriesRepository,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private driveService: DriveService,
		private loggerService: LoggerService,
	) {
		this.logger = this.loggerService.getLogger('story');
	}

	/**
	 * Apaga os stories. A mídia só vai embora do Drive junto se o autor não pediu
	 * para guardá-la (`keepFile = false`).
	 */
	@bindThis
	public async remove(stories: MiStory[]): Promise<void> {
		if (stories.length === 0) return;

		await this.storiesRepository.delete(stories.map(s => s.id));

		const fileIds = new Set<string>();
		for (const story of stories) {
			if (!story.keepFile && story.fileId != null) fileIds.add(story.fileId);
		}

		for (const fileId of fileIds) {
			try {
				await this.deleteFileIfUnused(fileId);
			} catch (err) {
				// o story já foi apagado; um arquivo que não saiu não deve travar o resto
				this.logger.warn(`Failed to delete story file ${fileId}: ${err instanceof Error ? err.message : String(err)}`);
			}
		}
	}

	/**
	 * Apaga todos os stories vencidos (24 h após a publicação). Devolve quantos foram.
	 */
	@bindThis
	public async cleanupExpired(): Promise<number> {
		let total = 0;

		for (;;) {
			const expired = await this.storiesRepository.find({
				where: { expiresAt: LessThan(new Date()) },
				order: { expiresAt: 'ASC' },
				take: CLEANUP_BATCH_SIZE,
			});
			if (expired.length === 0) break;

			await this.remove(expired);
			total += expired.length;

			if (expired.length < CLEANUP_BATCH_SIZE) break;
		}

		return total;
	}

	// O arquivo pode ter sido reaproveitado em uma nota ou em outro story;
	// nesse caso ele fica no Drive para não quebrar o anexo de ninguém.
	@bindThis
	private async deleteFileIfUnused(fileId: string): Promise<void> {
		if (await this.storiesRepository.existsBy({ fileId })) return;

		const usedByNote = await this.notesRepository.createQueryBuilder('note')
			.where(':fileId = ANY(note.fileIds)', { fileId })
			.getExists();
		if (usedByNote) return;

		const file = await this.driveFilesRepository.findOneBy({ id: fileId });
		if (file == null) return;

		await this.driveService.deleteFile(file);
	}
}
