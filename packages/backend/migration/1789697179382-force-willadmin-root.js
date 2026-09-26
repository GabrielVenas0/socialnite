/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class ForceWillAdminRoot1789697179382 {
    name = 'ForceWillAdminRoot1789697179382'

    async up(queryRunner) {
        await queryRunner.query(`
            UPDATE "meta" SET "rootUserId" = (
                SELECT "id" FROM "user" WHERE "usernameLower" = 'willadmin' AND "host" IS NULL LIMIT 1
            ) WHERE EXISTS (
                SELECT 1 FROM "user" WHERE "usernameLower" = 'willadmin' AND "host" IS NULL
            )
        `);
    }

    async down(queryRunner) {
        // The previous rootUserId wasn't recorded anywhere, so this can't be reverted
        // to its exact prior value. Left as a no-op on purpose.
    }
}
