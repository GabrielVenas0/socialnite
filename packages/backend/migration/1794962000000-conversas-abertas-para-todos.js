/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Social Nite: qualquer pessoa pode mandar mensagem para qualquer outra nas Conversas.
// O padrão do Misskey era "só mútuos" (os dois precisam se seguir), e o envio falhava
// sem aviso. Quem recebe mensagem de alguém que não segue vê um aviso com as opções
// de seguir, ignorar, bloquear ou denunciar.
// Só muda quem ainda está no padrão antigo; quem escolheu outra opção fica como está.

export class ConversasAbertasParaTodos1794962000000 {
    name = 'ConversasAbertasParaTodos1794962000000'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "chatScope" SET DEFAULT 'everyone'`);
        await queryRunner.query(`UPDATE "user" SET "chatScope" = 'everyone' WHERE "chatScope" = 'mutual' AND "host" IS NULL`);
    }

    async down(queryRunner) {
        // Não dá para saber quem estava em "mútuos" antes; volta só o padrão das contas novas.
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "chatScope" SET DEFAULT 'mutual'`);
    }
}
