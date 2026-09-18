/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class GoogleSignin1789692664697 {
    name = 'GoogleSignin1789692664697'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "enableGoogleSignin" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "googleClientId" character varying(1024)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "googleClientSecret" character varying(1024)`);

        await queryRunner.query(`CREATE TABLE "user_google_account" ("id" character varying(32) NOT NULL, "userId" character varying(32) NOT NULL, "googleId" character varying(128) NOT NULL, "email" character varying(1024), "linkedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_user_google_account_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_user_google_account_userId" ON "user_google_account" ("userId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_user_google_account_googleId" ON "user_google_account" ("googleId") `);
        await queryRunner.query(`ALTER TABLE "user_google_account" ADD CONSTRAINT "FK_user_google_account_userId" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_google_account" DROP CONSTRAINT "FK_user_google_account_userId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_user_google_account_googleId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_user_google_account_userId"`);
        await queryRunner.query(`DROP TABLE "user_google_account"`);

        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "googleClientSecret"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "googleClientId"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "enableGoogleSignin"`);
    }
}
