/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Index, JoinColumn, Column, PrimaryColumn, ManyToOne } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';
import { MiStory } from './Story.js';

@Entity('story_view')
@Index('IDX_story_view_storyId_userId', ['storyId', 'userId'], { unique: true })
export class MiStoryView {
	@PrimaryColumn(id())
	public id: string;

	@Column(id())
	public storyId: MiStory['id'];

	@ManyToOne(type => MiStory, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ foreignKeyConstraintName: 'FK_story_view_storyId' })
	public story: MiStory | null;

	@Index('IDX_story_view_userId')
	@Column(id())
	public userId: MiUser['id'];

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn({ foreignKeyConstraintName: 'FK_story_view_userId' })
	public user: MiUser | null;

	constructor(data: Partial<MiStoryView>) {
		if (data == null) return;

		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}
