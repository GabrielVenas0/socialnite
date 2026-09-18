/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class OpenRegistrationByDefault1789687376593 {
    name = 'OpenRegistrationByDefault1789687376593'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "disableRegistration" SET DEFAULT false`);
        await queryRunner.query(`UPDATE "meta" SET "disableRegistration" = false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "disableRegistration" SET DEFAULT true`);
        await queryRunner.query(`UPDATE "meta" SET "disableRegistration" = true`);
    }
}
