/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// O aviso "cadastro só por convite" que o servidor mandava aos moderadores
// ficou gravado em inglês e japonês nos anúncios criados antes da tradução.
// Esta migração troca o texto para português e arquiva o aviso (ele vai para
// "Anúncios passados"): desde 10/11/2026 o cadastro não fecha mais sozinho.

const TITULO_ANTIGO = 'Change to Invitation-Only / 招待制に変更されました';
const TEXTO_ANTIGO = 'To Moderators,\n\nChanged to invitation only because no moderator activity was detected for 7 days.\nTo cancel the invitation only, you need to access the control panel.\n\n---------------\n\nTo モデレーター各位\n\nモデレーターの活動が7日間検出されなかったため、招待制に変更されました。\n招待制を解除するには、コントロールパネルにアクセスする必要があります。\n\n';

const TITULO_NOVO = 'O cadastro passou a ser só por convite';
const TEXTO_NOVO = 'Para os moderadores:\n\nO cadastro de novos usuários passou a ser só por convite porque nenhuma atividade de moderação foi detectada em 7 dias.\nPara voltar ao cadastro aberto, é preciso acessar o painel de controle.\n\nAviso antigo: desde 10/11/2026 o cadastro não fecha mais sozinho.';

export class TraduzAvisoCadastroPorConvite1789766600000 {
    name = 'TraduzAvisoCadastroPorConvite1789766600000'

    async up(queryRunner) {
        await queryRunner.query(
            `UPDATE "announcement" SET "title" = $1, "text" = $2, "isActive" = false WHERE "title" = $3`,
            [TITULO_NOVO, TEXTO_NOVO, TITULO_ANTIGO],
        );
    }

    async down(queryRunner) {
        // Volta o texto antigo. Não dá para saber quais avisos estavam ativos antes, então "isActive" fica como está.
        await queryRunner.query(
            `UPDATE "announcement" SET "title" = $1, "text" = $2 WHERE "title" = $3`,
            [TITULO_ANTIGO, TEXTO_ANTIGO, TITULO_NOVO],
        );
    }
}
