/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class UserPhone1789701342016 {
    name = 'UserPhone1789701342016'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "phone" character varying(32)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "requirePhoneAndEmailForSignup" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "requirePhoneAndEmailForSignup"`);
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "phone"`);
    }
}
