/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class FixCustomEntityColumnComments1794961800000 {
    name = 'FixCustomEntityColumnComments1794961800000'

    async up(queryRunner) {
        await queryRunner.query(`COMMENT ON COLUMN "user_profile"."phone" IS 'The phone number of the User.'`);
        await queryRunner.query(`COMMENT ON COLUMN "story"."userId" IS 'The ID of author.'`);
        await queryRunner.query(`COMMENT ON COLUMN "story"."fileId" IS 'Story só com texto não tem arquivo.'`);
        await queryRunner.query(`COMMENT ON COLUMN "story"."keepFile" IS 'Quando false, o arquivo é apagado do Drive junto com o story.'`);
        await queryRunner.query(`COMMENT ON COLUMN "user_google_account"."googleId" IS 'The "sub" (subject) claim from the Google ID token. Stable per Google account.'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`COMMENT ON COLUMN "user_google_account"."googleId" IS NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "story"."keepFile" IS NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "story"."fileId" IS NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "story"."userId" IS NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "user_profile"."phone" IS NULL`);
    }
}
