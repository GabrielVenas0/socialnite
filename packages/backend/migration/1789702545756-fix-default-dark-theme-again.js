/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class FixDefaultDarkThemeAgain1789702545756 {
    name = 'FixDefaultDarkThemeAgain1789702545756'

    async up(queryRunner) {
        // The previous migration only touched rows WHERE defaultDarkTheme IS NULL.
        // The "meta" table has historically ended up with more than one row on some
        // instances (the app always reads the row with the highest id - see
        // MetaService.fetch()), so this one is unconditional across every row to be
        // safe regardless of how many rows exist or what they currently hold.
        await queryRunner.query(`UPDATE "meta" SET "defaultDarkTheme" = 'd_social_nite'`);
        await queryRunner.query(`UPDATE "meta" SET "themeColor" = '#0972c4'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`UPDATE "meta" SET "defaultDarkTheme" = NULL WHERE "defaultDarkTheme" = 'd_social_nite'`);
    }
}
