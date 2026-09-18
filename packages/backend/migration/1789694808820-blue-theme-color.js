/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class BlueThemeColor1789694808820 {
    name = 'BlueThemeColor1789694808820'

    async up(queryRunner) {
        await queryRunner.query(`UPDATE "meta" SET "themeColor" = '#0972c4' WHERE "themeColor" = '#753cdf' OR "themeColor" IS NULL`);
    }

    async down(queryRunner) {
        await queryRunner.query(`UPDATE "meta" SET "themeColor" = '#753cdf' WHERE "themeColor" = '#0972c4'`);
    }
}
