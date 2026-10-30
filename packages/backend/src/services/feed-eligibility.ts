/*
 * SPDX-FileCopyrightText: syuilo and misskey-project (SocialNite fork)
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Eligibilidade de exibição de um post no feed principal.
 *
 * Variáveis proposicionais (propositions):
 *   p_follow  (A): o autor do post pertence ao conjunto de quem o usuário segue (F).
 *   p_interest(B): o post possui ao menos uma tag contida no conjunto de interesses (I).
 *   p_nsfw   (C): o post é sensível/NSFW E o filtro restritivo do usuário está ativo.
 *   p_muted  (D): o post está no conjunto de bloqueados/mutados do usuário (M).
 *
 * Saída:
 *   E (ExibirPost) = (A ∨ B) ∧ ¬C ∧ ¬D.
 *
 * Tabela Verdade completa (2^4 = 16 linhas), em ordem de índice
 * idx = 8·D + 4·C + 2·B + A:
 *
 * idx | A | B | C | D | E
 * ----+---+---+---+---+----
 *  0  | 0 | 0 | 0 | 0 | 0   (nem segue, nem interesse)
 *  1  | 1 | 0 | 0 | 0 | 1   (segue autor)
 *  2  | 0 | 1 | 0 | 0 | 1   (interesse por tag)
 *  3  | 1 | 1 | 0 | 0 | 1   (segue e interessa)
 *  4  | 0 | 0 | 1 | 0 | 0   (NSFW sob filtro)
 *  5  | 1 | 0 | 1 | 0 | 0   (NSFW sob filtro, mesmo seguindo)
 *  6  | 0 | 1 | 1 | 0 | 0   (NSFW sob filtro, mesmo com interesse)
 *  7  | 1 | 1 | 1 | 0 | 0   (NSFW sob filtro)
 *  8  | 0 | 0 | 0 | 1 | 0   (bloqueado/mutado)
 *  9  | 1 | 0 | 0 | 1 | 0   (bloqueado/mutado)
 * 10  | 0 | 1 | 0 | 1 | 0   (bloqueado/mutado)
 * 11  | 1 | 1 | 0 | 1 | 0   (bloqueado/mutado)
 * 12  | 0 | 0 | 1 | 1 | 0   (bloqueado/mutado + NSFW)
 * 13  | 1 | 0 | 1 | 1 | 0   (bloqueado/mutado + NSFW)
 * 14  | 0 | 1 | 1 | 1 | 0   (bloqueado/mutado + NSFW)
 * 15  | 1 | 1 | 1 | 1 | 0   (bloqueado/mutado + NSFW)
 */
export const FEED_ELIGIBILITY_TRUTH_TABLE: readonly boolean[] = [
	false, // 0
	true,  // 1
	true,  // 2
	true,  // 3
	false, // 4
	false, // 5
	false, // 6
	false, // 7
	false, // 8
	false, // 9
	false, // 10
	false, // 11
	false, // 12
	false, // 13
	false, // 14
	false, // 15
];

export interface FeedEligibilityInput {
	/** A: autor seguido pelo usuário. */
	readonly isFollowingAuthor?: boolean;
	/** A (alias). */
	readonly A?: boolean;
	/** B: post possui tag de interesse do usuário. */
	readonly hasInterestTag?: boolean;
	/** B (alias). */
	readonly B?: boolean;
	/** Post é sensível/NSFW. */
	readonly isSensitivePost?: boolean;
	/** Usuário possui filtro restritivo de conteúdo sensível ativo. */
	readonly restrictiveNsfwFilter?: boolean;
	/** C (pré-calculado): sensível E filtro restritivo. */
	readonly isRestrictedSensitive?: boolean;
	/** C (alias). */
	readonly C?: boolean;
	/** D: post bloqueado ou mutado. */
	readonly isBlockedOrMuted?: boolean;
	/** D (alias). */
	readonly D?: boolean;
}

export interface FeedEligibilityVariables {
	readonly A: boolean;
	readonly B: boolean;
	readonly C: boolean;
	readonly D: boolean;
}

function normalizeVariables(input: unknown): { A: boolean; B: boolean; C: boolean; D: boolean } {
	const source = (input && typeof input === 'object') ? (input as Record<string, unknown>) : {};

	const A =
		source.A ?? source.isFollowingAuthor ?? source.isAuthorFollowed ??
		source.followsAuthor ?? source.following ?? source.isFollowing;

	const B =
		source.B ?? source.hasInterestTag ?? source.hasInterest ??
		source.matchesInterest ?? source.intersectsInterest;

	let C: unknown;
	if (source.C !== undefined || source.isRestrictedSensitive !== undefined) {
		C = source.C ?? source.isRestrictedSensitive;
	} else if (source.isNsfwBlocked !== undefined || source.sensitiveAndRestricted !== undefined) {
		C = source.isNsfwBlocked ?? source.sensitiveAndRestricted;
	} else {
		const sensitive = source.isSensitivePost ?? source.isSensitive ?? source.isNsfw ?? source.nsfw;
		const restrictive = source.restrictiveNsfwFilter ?? source.restrictiveFilter ?? source.nsfwFilterActive;
		C = Boolean(sensitive) && Boolean(restrictive);
	}

	const D =
		source.D ?? source.isBlockedOrMuted ?? source.blocked ?? source.muted ??
		source.blockedOrMuted;

	return {
		A: Boolean(A),
		B: Boolean(B),
		C: Boolean(C),
		D: Boolean(D),
	};
}

/**
 * Decisão pura em O(1): consulta a tabela verdade FEED_ELIGIBILITY_TRUTH_TABLE.
 * Aceita tanto objeto com variáveis/aliases, quanto os 4 booleanos A, B, C, D.
 */
export function isFeedEligible(
	input: FeedEligibilityInput | FeedEligibilityVariables,
): boolean;
export function isFeedEligible(
	isFollowingAuthor: boolean,
	hasInterestTag: boolean,
	isSensitiveAndRestricted: boolean,
	isBlockedOrMuted: boolean,
): boolean;
export function isFeedEligible(...args: unknown[]): boolean {
	let A: boolean;
	let B: boolean;
	let C: boolean;
	let D: boolean;

	if (
		args.length >= 4 &&
		typeof args[0] === 'boolean' &&
		typeof args[1] === 'boolean' &&
		typeof args[2] === 'boolean' &&
		typeof args[3] === 'boolean'
	) {
		A = args[0] as boolean;
		B = args[1] as boolean;
		C = args[2] as boolean;
		D = args[3] as boolean;
	} else {
		const normalized = normalizeVariables(args[0]);
		A = normalized.A;
		B = normalized.B;
		C = normalized.C;
		D = normalized.D;
	}

	const index = (D ? 8 : 0) | (C ? 4 : 0) | (B ? 2 : 0) | (A ? 1 : 0);
	return FEED_ELIGIBILITY_TRUTH_TABLE[index];
}

export const isPostEligible = isFeedEligible;
export const canShowInFeed = isFeedEligible;
export const feedEligible = isFeedEligible;
export const evaluateFeedEligibility = isFeedEligible;
