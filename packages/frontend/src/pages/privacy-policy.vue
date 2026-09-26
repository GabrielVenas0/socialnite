<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader>
	<div class="_spacer" style="--MI_SPACER-w: 800px;">
		<div class="_gaps">
			<div :class="$style.meta">
				<div :class="$style.metaRow">
					<span :class="$style.metaLabel">Vigência a partir de</span>
					<span :class="$style.metaValue">{{ LEGAL.effectiveDate }}</span>
				</div>
				<div :class="$style.metaRow">
					<span :class="$style.metaLabel">Responsável pelo tratamento</span>
					<span :class="$style.metaValue">{{ LEGAL.operator }}</span>
				</div>
				<div :class="$style.metaRow">
					<span :class="$style.metaLabel">Contato</span>
					<span :class="$style.metaValue">{{ LEGAL.contactEmail }}</span>
				</div>
			</div>

			<div :class="$style.body">
				<p>Esta Política explica quais dados o Social Nite coleta, por que coleta, com quem compartilha e o que você pode exigir a respeito. Ela segue a Lei Geral de Proteção de Dados (Lei 13.709/2018).</p>

				<hr :class="$style.hr"/>

				<h2>1. Quem é o responsável</h2>
				<p>O Social Nite é operado por <strong>{{ LEGAL.operator }}</strong>, que decide como e por que seus dados são tratados. Para qualquer assunto desta Política, incluindo o exercício dos seus direitos, escreva para <strong>{{ LEGAL.contactEmail }}</strong>.</p>

				<h2>2. Que dados coletamos</h2>

				<h3>2.1 Dados que você fornece</h3>
				<ul>
					<li><strong>Cadastro:</strong> nome de usuário, senha, e-mail e telefone.</li>
					<li><strong>Perfil:</strong> nome de exibição, descrição, foto, banner, data de nascimento e localização — todos opcionais.</li>
					<li><strong>Conteúdo:</strong> notas, respostas, mensagens, arquivos, stories, enquetes e reações que você publica.</li>
				</ul>

				<h3>2.2 Dados gerados pelo uso</h3>
				<ul>
					<li><strong>Endereço IP e data de acesso</strong>, registrados a cada login por segurança.</li>
					<li><strong>Preferências</strong> de interface, guardadas no seu navegador.</li>
					<li><strong>Inscrição de notificação</strong>, se você autorizar receber avisos no celular.</li>
				</ul>

				<h3>2.3 O que não coletamos</h3>
				<p>Não pedimos documentos, dados bancários nem localização em tempo real. <strong>Não usamos rastreadores de publicidade</strong> e não vendemos dados a ninguém.</p>

				<h2>3. Sua senha</h2>
				<p>Sua senha é guardada em formato embaralhado e irreversível (bcrypt). <strong>Ninguém consegue lê-la</strong> — nem a administração. Se você esquecê-la, o sistema gera uma nova; ninguém recupera a antiga.</p>

				<h2>4. Por que tratamos cada dado</h2>
				<ul>
					<li><strong>Manter sua conta funcionando</strong> — execução do contrato entre você e o serviço (art. 7º, V da LGPD).</li>
					<li><strong>Segurança e moderação</strong> — registro de IP e histórico de moderação, com base no legítimo interesse de manter a rede segura (art. 7º, IX).</li>
					<li><strong>E-mail e telefone</strong> — para confirmar sua identidade e permitir a recuperação de senha.</li>
					<li><strong>Notificações</strong> — somente com o seu consentimento, que pode ser retirado quando quiser.</li>
				</ul>

				<h2>5. Quem vê o que você publica</h2>
				<p>Depende da visibilidade que você escolhe ao publicar. Conteúdo público pode ser visto por qualquer pessoa com acesso à rede, inclusive visitantes não cadastrados, conforme a configuração do servidor.</p>
				<p><strong>A federação está desligada.</strong> Suas notas, seu perfil e seus arquivos não são enviados nem replicados para outros servidores, como Mastodon ou outras instâncias Misskey.</p>
				<p>Seu <strong>e-mail e telefone nunca são exibidos publicamente</strong>. Eles ficam visíveis apenas para você e para a administração.</p>

				<h2>6. Com quem compartilhamos</h2>
				<p>Com ninguém, para fins comerciais. O compartilhamento ocorre apenas quando:</p>
				<ul>
					<li>é necessário para operar o serviço — servidor de hospedagem, serviço de envio de e-mail e o serviço de notificação do seu próprio navegador ou celular;</li>
					<li>você entra com o Google: nesse caso o Google nos informa seu nome, e-mail e identificador de conta, e o uso desses dados também segue a política do próprio Google;</li>
					<li>há ordem judicial ou requisição legal.</li>
				</ul>

				<h2>7. Por quanto tempo guardamos</h2>
				<ul>
					<li><strong>Conta ativa:</strong> enquanto ela existir.</li>
					<li><strong>Conta excluída:</strong> seus dados e conteúdos são removidos. O nome de usuário fica reservado para impedir que outra pessoa se passe por você.</li>
					<li><strong>Registros de acesso:</strong> mantidos por até 6 meses, conforme o Marco Civil da Internet (Lei 12.965/2014, art. 15).</li>
					<li><strong>Stories:</strong> expiram automaticamente em 24 horas.</li>
					<li><strong>Registros de moderação:</strong> preservados enquanto necessários para defesa em processo.</li>
				</ul>

				<h2>8. Seus direitos</h2>
				<p>A LGPD garante que você pode, a qualquer momento:</p>
				<ul>
					<li>confirmar se tratamos dados seus e <strong>acessá-los</strong>;</li>
					<li><strong>corrigir</strong> dados incompletos ou errados — a maior parte você mesmo edita nas configurações;</li>
					<li><strong>exportar</strong> suas notas e sua lista de contatos, em Configurações → Dados da conta;</li>
					<li><strong>excluir</strong> sua conta e seus dados, também em Configurações;</li>
					<li><strong>retirar o consentimento</strong> para notificações;</li>
					<li>opor-se a um tratamento e pedir revisão de decisões automatizadas.</li>
				</ul>
				<p>Para o que não der para resolver sozinho, escreva para <strong>{{ LEGAL.contactEmail }}</strong>. Respondemos em até 15 dias.</p>

				<h2>9. Menores de idade</h2>
				<p>A idade mínima para criar conta é <strong>{{ LEGAL.minAge }} anos</strong>. Quem tiver menos de 16 anos só pode usar o serviço com o consentimento de pelo menos um dos pais ou do responsável legal, que pode nos contatar a qualquer momento para pedir a exclusão dos dados.</p>

				<h2>10. Segurança</h2>
				<p>Usamos conexão criptografada (HTTPS), senhas embaralhadas de forma irreversível e acesso administrativo restrito. Nenhum sistema é totalmente imune: se acontecer um incidente que possa trazer risco relevante a você, avisaremos você e a Autoridade Nacional de Proteção de Dados.</p>

				<h2>11. Cookies e armazenamento local</h2>
				<p>Não usamos cookies de rastreamento ou publicidade. O que guardamos no seu navegador é o necessário para manter sua sessão aberta e lembrar suas preferências de interface.</p>

				<h2>12. Mudanças nesta Política</h2>
				<p>Se alterarmos algo relevante, avisaremos dentro da própria plataforma antes de a mudança valer. A data de vigência no topo indica a versão atual.</p>

				<h2>13. Encarregado de dados</h2>
				<p>Pedidos relativos a dados pessoais devem ser enviados para <strong>{{ LEGAL.contactEmail }}</strong>. Você também pode reclamar diretamente à Autoridade Nacional de Proteção de Dados (ANPD), em <a href="https://www.gov.br/anpd" rel="noopener noreferrer" target="_blank">gov.br/anpd</a>.</p>

				<hr :class="$style.hr"/>

				<p :class="$style.footer">Este documento é parte integrante dos <MkA to="/tos">Termos de Uso</MkA> do Social Nite.</p>
			</div>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { LEGAL } from '@/utility/legal-info.js';
import { definePage } from '@/page.js';

definePage(() => ({
	title: 'Política de Privacidade',
	icon: 'ti ti-lock',
}));
</script>

<style lang="scss" module>
.meta {
	padding: 16px;
	border: 1px solid var(--MI_THEME-divider);
	border-radius: var(--MI-radius);
	font-size: 0.9em;
}

.metaRow {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;

	&:not(:last-child) {
		margin-bottom: 8px;
	}
}

.metaLabel {
	flex: 0 0 auto;
	min-width: 180px;
	opacity: 0.7;
}

.metaValue {
	flex: 1;
	min-width: 0;
	font-weight: 700;
}

.body {
	line-height: 1.7;

	h2 {
		margin: 1.6em 0 0.6em;
		font-size: 1.1em;
	}

	h3 {
		margin: 1.2em 0 0.4em;
		font-size: 1em;
		opacity: 0.9;
	}

	ul {
		padding-left: 1.4em;
	}

	li {
		margin-bottom: 0.4em;
	}
}

.hr {
	margin: 1.5em 0;
	border: none;
	border-top: 1px solid var(--MI_THEME-divider);
}

.footer {
	opacity: 0.7;
	font-size: 0.9em;
}
</style>
