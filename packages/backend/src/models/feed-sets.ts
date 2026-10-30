/*
 * SPDX-FileCopyrightText: syuilo and misskey-project (SocialNite fork)
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiNote } from './Note.js';
import type { MiUser } from './User.js';

/**
 * Discrete identifiers used by the set-theoretic feed model.
 *
 * In set notation:
 *   p ∈ PostId, u ∈ UserId, t ∈ Tag
 */
export type PostId = MiNote['id'];
export type UserId = MiUser['id'];
export type Tag = string;
export type MediaKind = string;

/**
 * A finite subset of a domain. We use ReadonlySet<T> as the canonical
 * representation of a mathematical set A ⊆ Domain.
 */
export type PostSet = ReadonlySet<PostId>;
export type UserSet = ReadonlySet<UserId>;
export type TagSet = ReadonlySet<Tag>;
export type MediaSet = ReadonlySet<MediaKind>;

/**
 * Discrete mapping (album/mapping) f: K -> V. Modeled as a read-only Map,
 * i.e. a single-valued relation between discrete domains. A "column" of
 * such a mapping is exactly a fiber (preimage) of a value, which is itself a
 * set and therefore composable with the set operations below.
 */
export type DiscreteMap<K, V> = ReadonlyMap<K, V>;
export type PostAuthorMap = DiscreteMap<PostId, UserId>;
export type PostTagMap = DiscreteMap<PostId, TagSet>;
export type PostMediaMap = DiscreteMap<PostId, MediaSet>;

/**
 * Incidence relation between users and tags, R ⊆ UserId × Tag.
 * Represented as a map u ↦ I(u) (the tag set of interest of user u).
 */
export type UserInterestMap = DiscreteMap<UserId, TagSet>;

/**
 * Directed follow graph F ⊆ UserId × UserId, modeled as an adjacency
 * "album": v ↦ { u | (v, u) ∈ F }.
 */
export type FollowGraph = DiscreteMap<UserId, UserSet>;

/* -------------------------------------------------------------------------- */
/*                               Set primitives                               */
/* -------------------------------------------------------------------------- */

export function union<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): Set<T> {
	const result = new Set<T>(a);
	for (const x of b) result.add(x);
	return result;
}

export function intersection<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): Set<T> {
	const result = new Set<T>();
	for (const x of a) {
		if (b.has(x)) result.add(x);
	}
	return result;
}

export function difference<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): Set<T> {
	const result = new Set<T>();
	for (const x of a) {
		if (!b.has(x)) result.add(x);
	}
	return result;
}

export function symmetricDifference<T>(a: ReadonlySet<T>, b: ReadonlySet<T>): Set<T> {
	const result = new Set<T>();
	for (const x of a) {
		if (!b.has(x)) result.add(x);
	}
	for (const x of b) {
		if (!a.has(x)) result.add(x);
	}
	return result;
}

export function complement<T>(universal: ReadonlySet<T>, subset: ReadonlySet<T>): Set<T> {
	return difference(universal, subset);
}

export function emptySet<T>(): Set<T> {
	return new Set<T>();
}

export function filterSet<T>(source: ReadonlySet<T>, predicate: (x: T) => boolean): Set<T> {
	const result = new Set<T>();
	for (const x of source) {
		if (predicate(x)) result.add(x);
	}
	return result;
}

export function fiberOf<K, V>(mapping: DiscreteMap<K, V>, value: V): Set<K> {
	const result = new Set<K>();
	for (const [k, v] of mapping) {
		if (v === value) result.add(k);
	}
	return result;
}

export function fibersContaining<K, V>(mapping: DiscreteMap<K, ReadonlySet<V>>, element: V): Set<K> {
	const result = new Set<K>();
	for (const [k, values] of mapping) {
		if (values.has(element)) result.add(k);
	}
	return result;
}

/* -------------------------------------------------------------------------- */
/*                            Feed set algebra                                */
/* -------------------------------------------------------------------------- */

export interface FeedSetInput {
	/** U: universal set of all post IDs in the instance. */
	readonly universal: PostSet;
	/** f_author: U -> UserId */
	readonly authorOf: PostAuthorMap;
	/** F_base(v): users followed by the viewer. */
	readonly followingUsers: UserSet;
	/**
	 * D(v): posts that are "direct interactions" of the viewer (mentions,
	 * replies to the viewer, renote/quote of the viewer, etc.).
	 */
	readonly directInteractionPosts?: PostSet;
	/** I_tags(v): tag vocabulary the viewer is interested in. */
	readonly interestTags: TagSet;
	/** I_media(v): media kinds the viewer is interested in. */
	readonly interestMedia: MediaSet;
	/** Tags: U -> P(Tag) */
	readonly postTags: PostTagMap;
	/** Media: U -> P(MediaKind) */
	readonly postMedia: PostMediaMap;
	/** Blocked/muted users (posts of these authors must vanish): M. */
	readonly blockedUsers: UserSet;
	readonly mutedUsers: UserSet;
	/** Posts explicitly blocked/muted by the viewer (thread-level etc.): M. */
	readonly explicitlyBlockedPosts?: PostSet;
	readonly mutedThreadPosts?: PostSet;
	/** Posts marked sensitive/NSFW: S. */
	readonly sensitivePosts?: PostSet;
	/** Viewer has restrictive NSFW filter active. */
	readonly restrictiveNsfwFilter?: boolean;
	/** V: previously seen/viewed posts, for freshness. */
	readonly viewedPosts?: PostSet;
	/** Backward-compatible alias (optional) handled as viewed posts. */
	readonly seenPosts?: PostSet;
}

export interface ViewerFeedSets {
	readonly viewerId: UserId;
	/** U */
	readonly U: PostSet;
	/** F_base (user-level followees) */
	readonly followingUsers: UserSet;
	/** F_authored(v) */
	readonly followedAuthorPosts: PostSet;
	/** F(v) := F_authored(v) ∪ D(v) */
	readonly followingPosts: PostSet;
	/** I_posts(v) */
	readonly interestPosts: PostSet;
	/** D(v) */
	readonly directInteractionPosts: PostSet;
	/** S(v): sensitive/NSFW posts. */
	readonly sensitivePosts: PostSet;
	/** M(v): blocked/muted posts, to be removed by difference. */
	readonly mutedPosts: PostSet;
	/** Safe universe: U \ M(v). Strict elimination of M. */
	readonly safeUniversal: PostSet;
	/** V(v): previously viewed posts. */
	readonly viewedPosts: PostSet;
	/** Posts matching followed or interesting content, without M/S. */
	readonly safeFollowingPosts: PostSet;
	readonly safeInterestPosts: PostSet;
	/** Candidate feed before ranking: (F ∪ I) \ (M ∪ filtered S). */
	readonly candidatePosts: PostSet;
	/** Discovery via symmetric difference: F Δ I, without M. */
	readonly discoveryPosts: PostSet;
	/** Non-followed complement in safe universe: (U \ M) \ F. */
	readonly nonFollowedPosts: PostSet;
	/** Unseen candidate subset: Candidate \ V. */
	readonly unseenCandidatePosts: PostSet;
}

export function deriveViewerFeedSets(viewerId: UserId, input: FeedSetInput): ViewerFeedSets {
	const U = input.universal;
	const authorOf = input.authorOf;

	const viewedPosts = new Set<PostId>(input.viewedPosts ?? input.seenPosts ?? []);

	const followedAuthorPosts = filterSet(U, (p) => {
		const author = authorOf.get(p);
		return author !== undefined && input.followingUsers.has(author);
	});

	const directInteractionPosts = input.directInteractionPosts ?? new Set<PostId>();

	const followingPosts = union(followedAuthorPosts, directInteractionPosts);

	const interestPosts = filterSet(U, (p) => {
		const tags = input.postTags.get(p) ?? new Set<Tag>();
		const media = input.postMedia.get(p) ?? new Set<MediaKind>();
		return (
			intersection(tags, input.interestTags).size > 0 ||
			intersection(media, input.interestMedia).size > 0
		);
	});

	const mutedAuthors = union(input.blockedUsers, input.mutedUsers);
	const mutedPostsFromAuthors = filterSet(U, (p) => {
		const author = authorOf.get(p);
		return author !== undefined && mutedAuthors.has(author);
	});

	const mutedPosts = union(
		mutedPostsFromAuthors,
		union(input.explicitlyBlockedPosts ?? new Set<PostId>(), input.mutedThreadPosts ?? new Set<PostId>()),
	);

	const sensitivePosts = input.sensitivePosts ?? new Set<PostId>();

	const safeUniversal = difference(U, mutedPosts);

	const safeFollowingPosts = intersection(followingPosts, safeUniversal);
	const safeInterestPosts = intersection(interestPosts, safeUniversal);

	let candidatePosts = intersection(union(followingPosts, interestPosts), safeUniversal);
	if (input.restrictiveNsfwFilter === true) {
		candidatePosts = difference(candidatePosts, sensitivePosts);
	}

	const discoveryPosts = intersection(symmetricDifference(followingPosts, interestPosts), safeUniversal);

	const nonFollowedPosts = difference(safeUniversal, followingPosts);

	const unseenCandidatePosts = difference(candidatePosts, viewedPosts);

	return {
		viewerId,
		U,
		followingUsers: input.followingUsers,
		followedAuthorPosts,
		followingPosts,
		interestPosts,
		directInteractionPosts,
		sensitivePosts,
		mutedPosts,
		safeUniversal,
		viewedPosts,
		safeFollowingPosts,
		safeInterestPosts,
		candidatePosts,
		discoveryPosts,
		nonFollowedPosts,
		unseenCandidatePosts,
	};
}

export function enforceElimination<T>(candidate: ReadonlySet<T>, blocked: ReadonlySet<T>): Set<T> {
	return difference(candidate, blocked);
}
