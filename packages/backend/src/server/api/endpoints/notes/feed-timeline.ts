/*
 * SPDX-FileCopyrightText: syuilo and misskey-project (SocialNite fork)
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { DriveFilesRepository, NotesRepository } from '@/models/_.js';
import { isFeedEligible } from '@/services/feed-eligibility.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../error.js';
import { deriveViewerFeedSets } from '@/models/feed-sets.js';

// Feature flag controlada apenas pelo servidor: desligada por padrão.
const SET_BASED_FEED_ENABLED = process.env.SET_BASED_FEED_ENABLED === 'true';

export const meta = {
	tags: ['notes'],

	requireCredential: true,
	kind: 'read:account',

	res: {
		type: 'object',
		optional: false,
		nullable: false,
		properties: {
			items: {
				type: 'array',
				optional: false,
				nullable: false,
				items: {
					type: 'object',
					optional: false,
					nullable: false,
					ref: 'Note',
				},
			},
			debug: {
				type: 'object',
				optional: true,
				nullable: true,
			},
		},
	},

	errors: {
		featureDisabled: {
			message: 'Set-based feed has been disabled.',
			code: 'SET_BASED_FEED_DISABLED',
			id: '7f3cc3a9-2c6e-4f8d-9a1b-6e5d4c3b2a10',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		debug: { type: 'boolean', default: false },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,
		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,
		private noteEntityService: NoteEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			if (!SET_BASED_FEED_ENABLED) throw new ApiError(meta.errors.featureDisabled);

			const limit = ps.limit ?? 10;
			// U = lote carregado pela consulta (limitado por `limit`).
			const posts = await this.notesRepository.find({ take: limit });

			// Classificação de "post sensível": post com CW (content warning)
			// OU que possua pelo menos um arquivo marcado como isSensitive.
			// Optamos por carregar os arquivos do lote (tamanho limitado por
			// `limit`) em uma única consulta, em vez de deixar a regra
			// implícita: a informação já existe no schema (MiDriveFile.isSensitive).
			const allFileIds = [...new Set(posts.flatMap((p) => p.fileIds ?? []))];
			const sensitiveFiles = allFileIds.length === 0
				? []
				: await this.driveFilesRepository.find({
					where: { id: allFileIds, isSensitive: true } as any,
					select: ['id'],
				});
			const sensitiveFileIds = new Set(sensitiveFiles.map((f) => f.id));
			const sensitivePosts = new Set(
				posts
					.filter((p) =>
						p.cw != null
						|| (p.fileIds ?? []).some((fileId) => sensitiveFileIds.has(fileId)),
					)
					.map((p) => p.id),
			);

			// Misskey não possui configuração de backend para filtro restritivo de
			// NSFW por visualizador: a preferência de exibição (prefer.s.nsfw)
			// fica no cliente. Como a regra do projeto proíbe receber configuração
			// sensível por parâmetro, mantemos o filtro restritivo inativo aqui.
			// Sem essa ativação, p_nsfw permanece false mesmo para posts sensíveis,
			// mas S (tamanho do conjunto S) ainda é reportado abaixo.
			const restrictiveNsfwFilter = false;

			const derived = deriveViewerFeedSets(me.id, {
				universal: new Set(posts.map(p => p.id)),
				authorOf: new Map(posts.map(p => [p.id, p.userId])),
				followingUsers: new Set(),
				interestTags: new Set(),
				interestMedia: new Set(),
				postTags: new Map(posts.map(p => [p.id, new Set(p.tags ?? [])])),
				postMedia: new Map(),
				blockedUsers: new Set(),
				mutedUsers: new Set(),
				viewedPosts: new Set(),
				sensitivePosts,
				restrictiveNsfwFilter,
			});

			// Uma linha por post do universo (U), incluindo os excluídos.
			// As proposições são derivadas da pertinência nos conjuntos calculados
			// por deriveViewerFeedSets; E é calculado pelo mesmo isFeedEligible
			// que decide a pertinência em candidatePosts.
			const rows = posts.map((p) => {
				const p_follow = derived.followingPosts.has(p.id);
				const p_interest = derived.interestPosts.has(p.id);
				const p_nsfw = sensitivePosts.has(p.id) && restrictiveNsfwFilter;
				const p_muted = derived.mutedPosts.has(p.id);
				const E = isFeedEligible(p_follow, p_interest, p_nsfw, p_muted);

				let excludedBy: string | null = null;
				if (!E) {
					// Precedência: p_muted, depois p_nsfw, depois ausência
					// simultânea de p_follow/p_interest.
					if (p_muted) excludedBy = 'p_muted';
					else if (p_nsfw) excludedBy = 'p_nsfw';
					else excludedBy = 'nenhuma de p_follow/p_interest';
				}

				return {
					noteId: p.id,
					p_follow,
					p_interest,
					p_nsfw,
					p_muted,
					E,
					excludedBy,
				};
			});

			// E é exatamente o critério usado para decidir quem entra em items.
			const eligiblePosts = posts.filter((_p, index) => rows[index]!.E);
			const items = await this.noteEntityService.packMany(eligiblePosts, me);

			if (ps.debug !== true) return { items };

			return {
				items,
				debug: {
					sizes: {
						U: derived.U.size,
						F: derived.followingPosts.size,
						I: derived.interestPosts.size,
						M: derived.mutedPosts.size,
						V: derived.viewedPosts.size,
						S: derived.sensitivePosts.size,
					},
					rows,
				},
			};
		});
	}
}
