/*
 * SPDX-FileCopyrightText: syuilo and misskey-project (SocialNite fork)
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable, Inject } from '@nestjs/common';
import { SelectQueryBuilder, Brackets } from 'typeorm';
import type { NotesRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { deriveViewerFeedSets } from '@/models/feed-sets.js';

/**
 * Parâmetros para a montagem do feed misto (cronológico + relevância).
 *
 * Conjuntos envolvidos:
 *   F = posts de quem o usuário segue
 *   I = posts públicos filtrados por relevância (tags de interesse)
 *   V = posts vistos recentemente
 *   B = posts de contas bloqueadas/mutadas
 *
 * Resultado: (F ∪ I) \ (V ∪ B), ordenado por relevância (F/I) e cronologia.
 */
export interface MixedFeedInput {
	/** Id do usuário visualizador. */
	readonly viewerId: string;
	/** F: ids de quem o usuário segue. */
	readonly followeeIds?: readonly string[];
	/** I: tags de interesse do usuário. */
	readonly interestTags?: readonly string[];
	/** V: posts vistos recentemente (a banir). */
	readonly seenPostIds?: readonly string[];
	/** M: ids de usuários bloqueados/mutados (autores banidos). */
	readonly blockedUserIds?: readonly string[];
	readonly mutedUserIds?: readonly string[];
	/** U opcional, para derivar F/I/M/V via deriveViewerFeedSets. */
	readonly universalPostIds?: readonly string[];
	/** NSFW filter ativo. */
	readonly restrictiveNsfwFilter?: boolean;
	/** Limite de paginação. */
	readonly limit?: number;
	/** Offset de paginação. */
	readonly offset?: number;
}

export type FeedTimelineQueryBuilder = SelectQueryBuilder<any>;

/**
 * Aplica as operações de conjuntos em nível de QueryBuilder do TypeORM:
 *
 *   (F ∪ I) \ (V ∪ B)
 *
 * - União (F ∪ I): predicado composto com OR (posts de followees OU tags de
 *   interesse), equivalente a UNION sem duplicatas a nível de linha.
 * - Diferença ( ... \ (V ∪ B)): AND NOT (id = ANY(V)) AND NOT (autor = ANY(B)).
 *
 * Os índices recomendados (B-Tree em FKs/id e GIN em `tags`) tornam as
 * verificações de pertinência O(log n) / O(1) amortizado no PostgreSQL.
 */
export function applyMixedFeedSetOperations(
	qb: SelectQueryBuilder<any>,
	input: MixedFeedInput,
): SelectQueryBuilder<any> {
	const followeeIds = [...(input.followeeIds ?? [])];
	const interestTags = [...(input.interestTags ?? [])];
	const seenPostIds = [...(input.seenPostIds ?? [])];
	const excludedUserIds = [...(input.blockedUserIds ?? []), ...(input.mutedUserIds ?? [])];

	// União F ∪ I (a nível de predicado).
	const unionConditions: string[] = [];
	// União F ∪ I, com I restrito a visibility = 'public'.
	if (followeeIds.length > 0) unionConditions.push('note.userId IN (:...followeeIds)');
	if (interestTags.length > 0) unionConditions.push("(note.tags && :interestTags AND note.visibility = 'public')");

	if (unionConditions.length === 0) {
		qb.andWhere('1 = 0');
	} else {
		qb.andWhere(new Brackets(b => {
			if (followeeIds.length > 0) b.where('note.userId IN (:...followeeIds)', { followeeIds });
			if (interestTags.length > 0) {
				if (followeeIds.length > 0) b.orWhere("note.tags && :interestTags AND note.visibility = 'public'", { interestTags });
				else b.where("note.tags && :interestTags AND note.visibility = 'public'", { interestTags });
			}
		}));
	}

	// Versão principal: deriva F/I/M/V a partir de U quando Fornecido.
	if (input.universalPostIds && input.universalPostIds.length > 0) {
		const authorOf = new Map();
		const derived = deriveViewerFeedSets(input.viewerId, {
			universal: new Set(input.universalPostIds),
			authorOf,
			followingUsers: new Set(input.followeeIds ?? []),
			interestTags: new Set(input.interestTags ?? []),
			interestMedia: new Set(),
			postTags: new Map(),
			postMedia: new Map(),
			blockedUsers: new Set(input.blockedUserIds ?? []),
			mutedUsers: new Set(input.mutedUserIds ?? []),
			viewedPosts: new Set(input.seenPostIds ?? []),
			restrictiveNsfwFilter: input.restrictiveNsfwFilter,
		});
		if (derived.candidatePosts.size === 0) {
			qb.andWhere('1 = 0');
		} else {
			qb.andWhere('note.id = ANY(:candidatePostIds)', { candidatePostIds: [...derived.candidatePosts] });
		}
	}

	// Diferença \ (V ∪ M): banimento estrito, com listas vazias omitidas.
	if (seenPostIds.length > 0) {
		qb.andWhere('NOT (note.id = ANY(:seenPostIds))', { seenPostIds });
	} else {
		qb.andWhere('NOT (note.id = ANY(\'{}\'::text[]))');
	}
	if (excludedUserIds.length > 0) {
		qb.andWhere('NOT (note.userId = ANY(:excludedUserIds))', { excludedUserIds });
	} else {
		qb.andWhere('NOT (note.userId = ANY(\'{}\'::text[]))');
	}

	// NSFW (S): só quando filtro restritivo estiver ativo.
	if (input.restrictiveNsfwFilter === true) {
		qb.andWhere("note.cw IS NULL");
	}

	// Ordenação por relevância (pertinência a F e a I) e cronologia.
	const scoreTerms: string[] = [];
	if (followeeIds.length > 0) scoreTerms.push('CASE WHEN note.userId IN (:...followeeIds) THEN 1 ELSE 0 END');
	if (interestTags.length > 0) scoreTerms.push('CASE WHEN note.tags && :interestTags THEN 1 ELSE 0 END');
	const scoreExpression = scoreTerms.length > 0 ? scoreTerms.join(' + ') : '0';

	qb.addSelect(scoreExpression, 'relevance')
		.orderBy('relevance', 'DESC')
		.addOrderBy('note.id', 'DESC');

	if (input.limit !== undefined) qb.limit(input.limit);
	if (input.offset !== undefined) qb.offset(input.offset);

	return qb;
}

/**
 * SQL puro equivalente, expressando as operações de conjuntos via CTEs.
 */
export function buildMixedFeedSetSql(input: MixedFeedInput): string {
	const interestTagsLiteral = (input.interestTags ?? []).map(t => `'${String(t).replace(/'/g, "''")}'`).join(', ');
	const followeeIdsLiteral = (input.followeeIds ?? []).map(id => `'${String(id).replace(/'/g, "''")}'`).join(', ');
	const seenIdsLiteral = (input.seenPostIds ?? []).map(id => `'${String(id).replace(/'/g, "''")}'`).join(', ');
	const excludedUsersLiteral = [...(input.blockedUserIds ?? []), ...(input.mutedUserIds ?? [])]
		.map(id => `'${String(id).replace(/'/g, "''")}'`).join(', ');

	const fCondition = followeeIdsLiteral ? `n."userId" IN (${followeeIdsLiteral})` : 'FALSE';
	const iCondition = interestTagsLiteral
		? `n."tags" && ARRAY[${interestTagsLiteral}]::varchar[] AND n."visibility" = 'public'`
		: 'FALSE';
	const nsfwCondition = input.restrictiveNsfwFilter === true ? ' AND n."cw" IS NULL' : '';

	const seenCondition = seenIdsLiteral
		? `AND NOT EXISTS (SELECT 1 FROM V v WHERE v."id" = c."id")`
		: '';
	const excludedCondition = excludedUsersLiteral
		? `AND NOT EXISTS (SELECT 1 FROM B b WHERE b."userId" = c."userId")`
		: '';

	const vCte = seenIdsLiteral
		? `,\n  V AS (\n    SELECT n.* FROM note n WHERE n."id" = ANY(ARRAY[${seenIdsLiteral}]::varchar[])\n  )`
		: '';
	const bCte = excludedUsersLiteral
		? `,\n  B AS (\n    SELECT n.* FROM note n WHERE n."userId" = ANY(ARRAY[${excludedUsersLiteral}]::varchar[])\n  )`
		: '';

	const relevanceTags = interestTagsLiteral ? `CASE WHEN c."tags" && ARRAY[${interestTagsLiteral}]::varchar[] THEN 1 ELSE 0 END` : '0';
	const relevanceFollowees = followeeIdsLiteral ? `CASE WHEN c."userId" IN (${followeeIdsLiteral}) THEN 1 ELSE 0 END` : '0';

	return `
WITH
  F AS (
    SELECT n.* FROM note n
    WHERE ${fCondition}
  ),
  I AS (
    SELECT n.* FROM note n
    WHERE ${iCondition}${nsfwCondition}
  ),
  Candidate AS (
    SELECT * FROM F
    UNION
    SELECT * FROM I
  )${vCte}${bCte}
SELECT c.* FROM Candidate c
WHERE TRUE
${seenCondition}
${excludedCondition}
${input.restrictiveNsfwFilter === true ? '  AND c."cw" IS NULL' : ''}
ORDER BY (
  ${relevanceFollowees} +
  ${relevanceTags}
) DESC, c."id" DESC
LIMIT ${input.limit ?? 20}
OFFSET ${input.offset ?? 0};
`.trim();
}

@Injectable()
export class FeedTimelineService {
	constructor(
		@Inject(DI.notesRepository)
		private readonly notesRepository: NotesRepository,
	) {}

	buildQuery(input: MixedFeedInput): SelectQueryBuilder<any> {
		const qb = this.notesRepository.createQueryBuilder('note')
			.innerJoinAndSelect('note.user', 'user');
		return applyMixedFeedSetOperations(qb, input);
	}

	async getMixedFeed(input: MixedFeedInput): Promise<unknown[]> {
		return this.buildQuery(input).getMany();
	}
}
