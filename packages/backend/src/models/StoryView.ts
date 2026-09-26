/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Index, JoinColumn, Column, PrimaryColumn, ManyToOne } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';
import { MiStory } from './Story.js';

@Entity('story_view')
@Index(['storyId', 'userId'], { unique: true })
export class MiStoryView {
	@PrimaryColumn(id())
	public id: string;

	@Column(id())
	public storyId: MiStory['id'];

	@ManyToOne(type => MiStory, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public story: MiStory | null;

	@Index()
	@Column(id())
	public userId: MiUser['id'];

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: MiUser | null;

	constructor(data: Partial<MiStoryView>) {
		if (data == null) return;

		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}
