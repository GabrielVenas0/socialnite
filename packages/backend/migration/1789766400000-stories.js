/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class Stories1789766400000 {
    name = 'Stories1789766400000'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "story" ("id" character varying(32) NOT NULL, "userId" character varying(32) NOT NULL, "fileId" character varying(32) NOT NULL, "text" character varying(500), "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_story_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_story_userId" ON "story" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_story_expiresAt" ON "story" ("expiresAt")`);
        await queryRunner.query(`ALTER TABLE "story" ADD CONSTRAINT "FK_story_userId" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "story" ADD CONSTRAINT "FK_story_fileId" FOREIGN KEY ("fileId") REFERENCES "drive_file"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        await queryRunner.query(`CREATE TABLE "story_view" ("id" character varying(32) NOT NULL, "storyId" character varying(32) NOT NULL, "userId" character varying(32) NOT NULL, CONSTRAINT "PK_story_view_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_story_view_storyId_userId" ON "story_view" ("storyId", "userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_story_view_userId" ON "story_view" ("userId")`);
        await queryRunner.query(`ALTER TABLE "story_view" ADD CONSTRAINT "FK_story_view_storyId" FOREIGN KEY ("storyId") REFERENCES "story"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "story_view" ADD CONSTRAINT "FK_story_view_userId" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "story_view" DROP CONSTRAINT "FK_story_view_userId"`);
        await queryRunner.query(`ALTER TABLE "story_view" DROP CONSTRAINT "FK_story_view_storyId"`);
        await queryRunner.query(`DROP TABLE "story_view"`);
        await queryRunner.query(`ALTER TABLE "story" DROP CONSTRAINT "FK_story_fileId"`);
        await queryRunner.query(`ALTER TABLE "story" DROP CONSTRAINT "FK_story_userId"`);
        await queryRunner.query(`DROP TABLE "story"`);
    }
}
