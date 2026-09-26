/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class StoryTextAndKeep1789766500000 {
    name = 'StoryTextAndKeep1789766500000'

    async up(queryRunner) {
        // story só com texto: a mídia passa a ser opcional
        await queryRunner.query(`ALTER TABLE "story" ALTER COLUMN "fileId" DROP NOT NULL`);
        // true por padrão: stories que já existiam nunca têm a mídia apagada por engano
        await queryRunner.query(`ALTER TABLE "story" ADD "keepFile" boolean NOT NULL DEFAULT true`);
    }

    async down(queryRunner) {
        await queryRunner.query(`DELETE FROM "story" WHERE "fileId" IS NULL`);
        await queryRunner.query(`ALTER TABLE "story" DROP COLUMN "keepFile"`);
        await queryRunner.query(`ALTER TABLE "story" ALTER COLUMN "fileId" SET NOT NULL`);
    }
}
