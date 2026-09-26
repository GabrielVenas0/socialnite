/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { PrimaryColumn, Entity, JoinColumn, Column, ManyToOne, Index } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';

@Entity('user_google_account')
export class MiUserGoogleAccount {
	@PrimaryColumn(id())
	public id: string;

	@Index({ unique: true })
	@Column(id())
	public userId: MiUser['id'];

	@ManyToOne(type => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: MiUser | null;

	@Index({ unique: true })
	@Column('varchar', {
		length: 128,
		comment: 'The "sub" (subject) claim from the Google ID token. Stable per Google account.',
	})
	public googleId: string;

	@Column('varchar', {
		length: 1024,
		nullable: true,
	})
	public email: string | null;

	@Column('timestamp with time zone', {
		default: () => 'now()',
	})
	public linkedAt: Date;

	constructor(data: Partial<MiUserGoogleAccount>) {
		if (data == null) return;

		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}
