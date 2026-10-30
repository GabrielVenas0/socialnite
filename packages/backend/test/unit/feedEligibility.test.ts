process.env.NODE_ENV = 'test';

import { describe, test, expect } from '@jest/globals';
import { isFeedEligible, FEED_ELIGIBILITY_TRUTH_TABLE } from '@/services/feed-eligibility.js';
import { union, difference, intersection } from '@/models/feed-sets.js';

const P = 'post-1' as const;

describe('feed eligibility truth table', () => {
	for (let mask = 0; mask < 16; mask++) {
		const A = Boolean(mask & 1); // p_follow
		const B = Boolean(mask & 2); // p_interest
		const C = Boolean(mask & 4); // p_nsfw
		const D = Boolean(mask & 8); // p_muted

		test(`combination ${mask} (A=${Number(A)},B=${Number(B)},C=${Number(C)},D=${Number(D)}) is consistent`, () => {
			const fnResult = isFeedEligible(A, B, C, D);
			const tableResult = FEED_ELIGIBILITY_TRUTH_TABLE[mask];

			// Set operation evaluation on a one-post universe U = {P}.
			const F = A ? new Set([P]) : new Set();
			const I = B ? new Set([P]) : new Set();
			const M = D ? new Set([P]) : new Set();
			const S = C ? new Set([P]) : new Set();
			const candidate = difference(difference(intersection(union(F, I), new Set([P])), M), S);
			const setResult = candidate.has(P);

			expect(fnResult).toBe(tableResult);
			expect(setResult).toBe(tableResult);
			expect(fnResult).toBe(setResult);
		});
	}

	test('truth table has exactly 3 true rows', () => {
		expect(FEED_ELIGIBILITY_TRUTH_TABLE.filter(Boolean)).toHaveLength(3);
	});

	// SQL/QueryBuilder remains out of this equivalence test because it requires
	// a PostgreSQL connection and is validated separately as query generation.
});
