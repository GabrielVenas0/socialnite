/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class SetDefaultDarkTheme1789697426234 {
    name = 'SetDefaultDarkTheme1789697426234'

    async up(queryRunner) {
        await queryRunner.query(`UPDATE "meta" SET "defaultDarkTheme" = 'd_social_nite' WHERE "defaultDarkTheme" IS NULL`);
    }

    async down(queryRunner) {
        await queryRunner.query(`UPDATE "meta" SET "defaultDarkTheme" = NULL WHERE "defaultDarkTheme" = 'd_social_nite'`);
    }
}
