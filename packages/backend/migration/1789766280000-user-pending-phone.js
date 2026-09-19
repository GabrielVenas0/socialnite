/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class UserPendingPhone1789766280000 {
    name = 'UserPendingPhone1789766280000'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_pending" ADD "phone" character varying(32)`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_pending" DROP COLUMN "phone"`);
    }
}
