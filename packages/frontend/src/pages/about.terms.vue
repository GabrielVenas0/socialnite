<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<div :class="$style.meta">
		<div :class="$style.metaRow">
			<span :class="$style.metaLabel">Vigência a partir de</span>
			<span :class="$style.metaValue">{{ LEGAL.effectiveDate }}</span>
		</div>
		<div :class="$style.metaRow">
			<span :class="$style.metaLabel">Responsável pelo serviço</span>
			<span :class="$style.metaValue">{{ LEGAL.operator }}</span>
		</div>
		<div :class="$style.metaRow">
			<span :class="$style.metaLabel">Contato</span>
			<span :class="$style.metaValue">{{ LEGAL.contactEmail }}</span>
		</div>
	</div>

	<div :class="$style.body">
		<p>Estes Termos explicam o que você pode esperar do Social Nite e o que esperamos de você. A linguagem é direta de propósito: o objetivo é que qualquer pessoa da comunidade consiga ler e entender.</p>

		<p><strong>Ao criar uma conta ou usar o Social Nite, você concorda com estes Termos.</strong> Se não concordar com alguma parte, não use o serviço.</p>
	</div>

	<div :class="$style.resumo">
		<h2 :class="$style.resumoTitle">Resumo rápido (não substitui o texto completo)</h2>
		<ul>
			<li>O Social Nite é uma rede social com <strong>cadastro aberto</strong>, mantida por {{ LEGAL.operator }}.</li>
			<li>A <strong>federação está desligada</strong>: o conteúdo publicado aqui <strong>não é enviado para outros servidores</strong>.</li>
			<li>O conteúdo que você publica continua <strong>seu</strong>; você só nos autoriza a exibi-lo dentro da plataforma.</li>
			<li>Existe <strong>moderação</strong>, e ela pode remover conteúdo ou suspender contas.</li>
			<li>O serviço é oferecido <strong>como está</strong>, sem garantia de funcionamento ininterrupto.</li>
			<li>O software é <strong>livre (AGPL-3.0)</strong>, baseado no projeto <strong>Misskey</strong>.</li>
		</ul>
	</div>

	<div :class="$style.body">
		<hr :class="$style.hr"/>

		<h2>1. O que é o Social Nite</h2>

		<p>O Social Nite é uma rede social mantida por {{ LEGAL.operator }}, com cadastro aberto a qualquer pessoa que aceite estes Termos. Nele você pode:</p>

		<ul>
			<li>publicar <strong>Notas</strong> (as publicações da plataforma) e interagir com as de outras pessoas;</li>
			<li>participar de <strong>Canais</strong>, que são fóruns organizados por tema;</li>
			<li>organizar pessoas em <strong>Redes de Pessoas</strong> (conjuntos de contas que você acompanha de perto);</li>
			<li>criar <strong>Redes de Palavras</strong>, que filtram e reúnem Notas por palavra-chave;</li>
			<li>guardar conteúdo em <strong>Notas Salvas</strong> (suas coleções pessoais);</li>
			<li>trocar mensagens em <strong>Conversas</strong> (chat entre duas pessoas);</li>
			<li>montar páginas próprias no <strong>Portfólio</strong>.</li>
		</ul>

		<p>O uso é oferecido sem cobrança às pessoas convidadas. O Social Nite não é um serviço comercial e não tem compromisso de nível de serviço (SLA).</p>

		<h2>2. A federação está desligada</h2>

		<p>O Misskey, software no qual o Social Nite é baseado, normalmente permite que servidores conversem entre si (federação). <strong>No Social Nite essa função está desativada.</strong></p>

		<p>Na prática, isso significa que:</p>

		<ul>
			<li>suas Notas, seu perfil, seus Canais e seus arquivos <strong>não são enviados nem replicados para outros servidores</strong> (Mastodon, outras instâncias Misskey etc.);</li>
			<li>você <strong>não consegue seguir</strong> contas hospedadas fora do Social Nite, nem ser seguido por elas;</li>
			<li>o conteúdo circula apenas dentro deste servidor.</li>
		</ul>

		<p :class="$style.aviso"><strong>Atenção:</strong> federação desligada não quer dizer que o conteúdo é privado. Dentro do Social Nite, uma Nota pública pode ser vista por qualquer pessoa com acesso ao servidor, pode ser copiada, impressa ou fotografada por quem a lê, e pode continuar existindo em cópias fora do nosso controle. Publique pensando nisso.</p>

		<h2>3. Quem pode usar</h2>

		<p>Para ter conta no Social Nite você precisa:</p>

		<ul>
			<li>ter recebido um <strong>convite</strong> válido — não há cadastro aberto ao público;</li>
			<li>ter pelo menos {{ LEGAL.minAge }} anos;</li>
			<li>atender ao requisito de vínculo definido pela instituição: o cadastro é aberto ao público.</li>
		</ul>

		<p>O convite é pessoal. Não repasse convites para pessoas que não atendem aos requisitos acima. Uma conta pertence a uma pessoa: não crie conta em nome de terceiros nem se passe por outra pessoa, real ou fictícia, de modo que possa enganar alguém.</p>

		<p>Contas automatizadas (bots) só são permitidas com autorização prévia da moderação e devem se identificar como tal.</p>

		<h2>4. Sua conta e sua senha</h2>

		<ul>
			<li>Você é responsável por tudo o que acontece na sua conta.</li>
			<li>Escolha uma senha forte e <strong>não a compartilhe</strong>. Se a plataforma oferecer autenticação em duas etapas, recomendamos ativá-la.</li>
			<li>Não use a mesma senha de outros serviços.</li>
			<li>Se desconfiar que alguém acessou sua conta, troque a senha e avise a moderação imediatamente pelo contato da seção 15.</li>
			<li>Não tente acessar a conta de outra pessoa, nem contornar limites técnicos, permissões ou mecanismos de segurança do servidor.</li>
		</ul>

		<p>Como o Social Nite é um projeto de porte pequeno, a recuperação de acesso é feita manualmente pela administração e pode depender da confirmação da sua identidade junto à instituição.</p>

		<h2>5. Conduta esperada</h2>

		<p>A regra geral é simples: <strong>trate as outras pessoas como você gostaria de ser tratado</strong>, e lembre que este é um espaço acadêmico/institucional, com pessoas que provavelmente convivem fora dele.</p>

		<p><strong>Não é permitido:</strong></p>

		<ul>
			<li>assédio, perseguição, ameaças, intimidação ou incitação para que outras pessoas façam isso;</li>
			<li>discurso de ódio ou ataques baseados em raça, cor, etnia, origem, religião, deficiência, idade, gênero, identidade de gênero ou orientação sexual;</li>
			<li>conteúdo sexual envolvendo crianças ou adolescentes — isso é crime e leva a bloqueio imediato e comunicação às autoridades;</li>
			<li>divulgar dados pessoais de terceiros sem consentimento (endereço, telefone, documentos, prints de conversas privadas);</li>
			<li>publicar material sexual explícito, violência gráfica ou conteúdo chocante fora das marcações de sensibilidade e das regras do Canal onde você está;</li>
			<li>spam, correntes, propaganda não solicitada, esquemas de pirâmide, golpes ou phishing;</li>
			<li>publicar código malicioso, ou usar a plataforma para atacar, sobrecarregar, varrer ou testar a segurança do servidor sem autorização escrita;</li>
			<li>raspagem automatizada em massa (scraping) do conteúdo da plataforma;</li>
			<li>publicar material que viole direitos autorais, marcas ou sigilo de terceiros;</li>
			<li>usar o Social Nite para atividade ilegal ou para violar as normas internas da instituição.</li>
		</ul>

		<p>Isso vale para <strong>Notas, Canais, Conversas, Portfólio</strong>, nomes de usuário, biografia, imagens de perfil, enquetes, arquivos enviados e nomes de <strong>Redes de Pessoas</strong>, <strong>Redes de Palavras</strong> e <strong>Notas Salvas</strong> que sejam visíveis a outras pessoas.</p>

		<p>As <strong>Conversas</strong> são privadas entre os participantes, mas não são anônimas nem imunes às regras: conteúdo ilegal ou assédio em Conversas também é passível de sanção quando denunciado.</p>

		<h2>6. Conteúdo que você publica</h2>

		<p><strong>O conteúdo é seu.</strong> Você mantém todos os direitos sobre as Notas, imagens, arquivos, páginas do Portfólio e demais materiais que publicar.</p>

		<p>Para que a plataforma funcione, você concede ao Social Nite uma <strong>licença não exclusiva, gratuita e limitada</strong> para armazenar, copiar, exibir, redimensionar, gerar miniaturas e distribuir esse conteúdo <strong>dentro do Social Nite</strong>, apenas na medida necessária para operar o serviço (mostrar sua Nota para quem te segue, gerar pré-visualização, incluir seu conteúdo em Canais, Redes de Palavras e backups técnicos).</p>

		<p>Essa licença:</p>

		<ul>
			<li><strong>não</strong> permite uso comercial do seu conteúdo;</li>
			<li><strong>não</strong> permite envio do seu conteúdo a outros servidores (a federação está desligada);</li>
			<li>termina quando você apaga o conteúdo — ressalvadas cópias temporárias em cache e em backups, que são descartadas conforme o ciclo normal de rotação, e cópias que outras pessoas já tenham feito por conta própria.</li>
		</ul>

		<p>Ao publicar, você declara que tem os direitos necessários sobre aquele material ou que o uso é permitido (licença livre, citação acadêmica com crédito, domínio público etc.).</p>

		<p>Trabalhos acadêmicos publicados no <strong>Portfólio</strong> ou em Notas continuam sujeitos às regras de integridade acadêmica da instituição.</p>

		<h2>7. Conteúdo de outras pessoas</h2>

		<p>O Social Nite hospeda conteúdo criado pelos próprios usuários. <strong>A instituição não revisa previamente o que é publicado</strong> e não endossa opiniões expressas em Notas, Canais, Conversas ou Portfólio.</p>

		<p>Se você encontrar conteúdo que viole estes Termos, use a função de denúncia da plataforma ou escreva para {{ LEGAL.contactEmail }}. Se você é titular de direitos autorais e identificou uma publicação indevida, envie a identificação do material, o link da publicação e a descrição do direito violado para o mesmo endereço.</p>

		<h2>8. Moderação e sanções</h2>

		<p>A moderação é feita pela administração do servidor, indicada por {{ LEGAL.operator }}.</p>

		<p>Conforme a gravidade e a reincidência, a moderação pode:</p>

		<ol>
			<li><strong>avisar</strong> você sobre a conduta;</li>
			<li><strong>remover ou ocultar</strong> uma Nota, um arquivo, uma página do Portfólio, um Canal ou marcá-lo como sensível;</li>
			<li><strong>silenciar</strong> a conta (limitar alcance) por prazo determinado;</li>
			<li><strong>suspender</strong> a conta temporariamente;</li>
			<li><strong>encerrar</strong> a conta em definitivo e revogar convites emitidos por ela.</li>
		</ol>

		<p>Casos graves — conteúdo criminoso, risco à segurança de pessoas ou ao servidor — podem levar à suspensão imediata, sem aviso prévio.</p>

		<p>Você pode <strong>contestar</strong> uma decisão de moderação escrevendo para {{ LEGAL.contactEmail }} em até {{ LEGAL.appealDays }} dias. A resposta é dada pela administração e, em caso de dúvida, pode ser encaminhada à instância institucional competente.</p>

		<p>Registros técnicos e conteúdos removidos podem ser preservados por prazo razoável quando necessários para apurar a denúncia, cumprir obrigação legal ou defender direitos.</p>

		<h2>9. Privacidade e dados pessoais</h2>

		<p>O tratamento dos seus dados é descrito na <strong>Política de Privacidade do Social Nite</strong>, disponível em <MkA to="/privacy-policy">Política de Privacidade</MkA>, que é parte integrante destes Termos.</p>

		<p>Em resumo, e sem substituir aquele documento: coletamos o mínimo necessário para operar a plataforma (dados de cadastro, conteúdo publicado e registros técnicos de acesso), não vendemos dados e não usamos seu conteúdo para publicidade.</p>

		<p>É <strong>compromisso</strong> da administração do Social Nite operar de acordo com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018) e atender pedidos de acesso, correção, exclusão e portabilidade dos seus dados. Este texto declara um compromisso de boas práticas; ele não é uma certificação nem um parecer jurídico de conformidade.</p>

		<p>Dúvidas ou pedidos relativos a dados pessoais: {{ LEGAL.contactEmail }}.</p>

		<h2>10. Disponibilidade, backups e garantias</h2>

		<p>O Social Nite é oferecido <strong>"como está"</strong>, no estado em que se encontra.</p>

		<ul>
			<li>Não garantimos funcionamento contínuo, ausência de erros, nem preservação permanente do conteúdo.</li>
			<li>Pode haver interrupções para manutenção, atualização, falha de infraestrutura ou fim do período letivo/projeto.</li>
			<li><strong>Faça sua própria cópia</strong> do que for importante para você. A plataforma oferece exportação de dados; use-a periodicamente.</li>
			<li>Na medida permitida pela lei, a instituição não responde por perda de conteúdo, lucros cessantes ou danos indiretos decorrentes do uso ou da indisponibilidade do serviço. Nada aqui afasta responsabilidades que a lei não permite excluir.</li>
		</ul>

		<p>Se o projeto for encerrado, faremos o possível para avisar com antecedência de pelo menos {{ LEGAL.shutdownNoticeDays }} dias e permitir a exportação dos dados antes do desligamento.</p>

		<h2>11. Software de código aberto</h2>

		<p>O Social Nite é um <strong>fork do <a href="https://misskey-hub.net/" target="_blank" rel="noopener noreferrer">Misskey</a></strong>, software livre distribuído sob a licença <strong>GNU Affero General Public License, versão 3 (AGPL-3.0)</strong>.</p>

		<ul>
			<li>Crédito e agradecimento ao projeto Misskey e às pessoas que o desenvolvem. O Social Nite <strong>não</strong> é afiliado, mantido nem endossado pelo projeto Misskey.</li>
			<li>Como exige a AGPL-3.0, o código-fonte desta instância, incluindo as modificações feitas para o Social Nite, está disponível em <a :href="LEGAL.sourceCodeUrl" rel="noopener noreferrer" target="_blank">{{ LEGAL.sourceCodeUrl }}</a>.</li>
			<li>A licença AGPL-3.0 se aplica ao <strong>software</strong>. Ela não se aplica ao conteúdo publicado pelos usuários, que segue as regras da seção 6.</li>
			<li>Marcas, logotipos e a identidade visual do Social Nite e da instituição não são cobertos pela licença do software.</li>
		</ul>

		<h2>12. Encerrar sua conta</h2>

		<p>Você pode pedir o encerramento da sua conta a qualquer momento, pelas configurações da plataforma ou escrevendo para {{ LEGAL.contactEmail }}.</p>

		<p>Ao encerrar:</p>

		<ul>
			<li>suas Notas, Notas Salvas, Redes de Pessoas, Redes de Palavras e páginas do Portfólio são removidos ou anonimizados conforme a Política de Privacidade;</li>
			<li>mensagens já enviadas em <strong>Conversas</strong> permanecem visíveis para o outro participante, porque também são conteúdo dele;</li>
			<li>alguns registros podem ser mantidos pelo prazo exigido por lei ou para apuração de incidentes.</li>
		</ul>

		<h2>13. Alterações destes Termos</h2>

		<p>Estes Termos podem mudar — por ajuste de regras da comunidade, mudança técnica ou exigência legal.</p>

		<ul>
			<li>Mudanças relevantes serão anunciadas na plataforma com antecedência de pelo menos {{ LEGAL.termsChangeNoticeDays }} dias antes de entrarem em vigor.</li>
			<li>A data de vigência no topo do documento é sempre atualizada.</li>
			<li>Se você continuar usando o Social Nite depois da entrada em vigor, entende-se que aceitou a nova versão. Se não concordar, encerre sua conta antes disso.</li>
		</ul>

		<h2>14. Lei aplicável e foro</h2>

		<p>Estes Termos são regidos pelas leis brasileiras.</p>

		<p>Fica eleito o foro da comarca de <strong>{{ LEGAL.jurisdiction }}</strong> para resolver questões decorrentes destes Termos, ressalvadas as hipóteses em que a lei determine foro diverso. Em relações de consumo, o Código de Defesa do Consumidor assegura a você o direito de acionar o serviço no foro do seu próprio domicílio.</p>

		<h2>15. Contato</h2>

		<ul>
			<li>Dúvidas, denúncias, recursos de moderação e pedidos sobre dados pessoais: {{ LEGAL.contactEmail }}</li>
			<li>Responsável pelo serviço: {{ LEGAL.operator }}</li>
			<li>Código-fonte: <a :href="LEGAL.sourceCodeUrl" rel="noopener noreferrer" target="_blank">{{ LEGAL.sourceCodeUrl }}</a></li>
		</ul>

		<hr :class="$style.hr"/>

		<blockquote :class="$style.nota">
			<p><strong>Nota para a equipe do Social Nite:</strong> todos os trechos entre colchetes precisam ser preenchidos antes da publicação. Nenhum nome de empresa, CNPJ, endereço, e-mail, prazo ou foro foi inventado neste documento. Este texto foi redigido para ser claro à comunidade, não como parecer jurídico — recomenda-se revisão pela assessoria jurídica da instituição antes de entrar em vigor.</p>
		</blockquote>
	</div>
</div>
</template>

<script lang="ts" setup>
// Conteúdo dos Termos de Uso. Os dados variáveis (responsável, contato, idade
// mínima) vivem em utility/legal-info.ts e são compartilhados com a Política de
// Privacidade. O cabeçalho e as abas são da página pai (about.vue ou tos.vue).
import { LEGAL } from '@/utility/legal-info.js';
</script>

<style lang="scss" module>
.meta {
	padding: 16px;
	border-radius: var(--MI-radius);
	background: var(--MI_THEME-panel);
	border-left: 4px solid var(--MI_THEME-accent);
}

.metaRow {
	display: flex;
	flex-wrap: wrap;
	align-items: baseline;
	gap: 4px 8px;

	&:not(:last-child) {
		margin-bottom: 8px;
	}
}

.metaLabel {
	font-weight: 700;

	&::after {
		content: ':';
	}
}

.metaValue {
	min-width: 0;
}

.resumo {
	padding: 16px 20px;
	border-radius: var(--MI-radius);
	background: var(--MI_THEME-accentedBg);

	ul {
		margin: 0;
		padding-left: 1.4em;
	}

	li:not(:last-child) {
		margin-bottom: 6px;
	}
}

.resumoTitle {
	margin: 0 0 10px;
	font-size: 1.1em;
	font-weight: 700;
	color: var(--MI_THEME-accent);
}

.body {
	line-height: 1.7;

	p {
		margin: 0 0 12px;
	}

	h2 {
		margin: 28px 0 10px;
		padding-bottom: 6px;
		font-size: 1.2em;
		font-weight: 700;
		border-bottom: solid 1px var(--MI_THEME-divider);
	}

	h3 {
		margin: 20px 0 8px;
		font-size: 1.05em;
		font-weight: 700;
	}

	ul, ol {
		margin: 0 0 12px;
		padding-left: 1.6em;
	}

	li:not(:last-child) {
		margin-bottom: 6px;
	}

	a {
		color: var(--MI_THEME-accent);
	}
}

.hr {
	margin: 24px 0;
	border: none;
	border-top: solid 1px var(--MI_THEME-divider);
}

.aviso {
	padding: 12px 16px;
	border-radius: var(--MI-radius);
	background: var(--MI_THEME-infoBg);
	color: var(--MI_THEME-infoFg);
}

.nota {
	margin: 0;
	padding: 12px 16px;
	border-left: 3px solid var(--MI_THEME-divider);
	color: var(--MI_THEME-fgTransparentWeak);
	font-size: 0.95em;

	p:last-child {
		margin-bottom: 0;
	}
}

.todo {
	display: inline;
	padding: 1px 6px;
	border-radius: 4px;
	border: dashed 1px var(--MI_THEME-accent);
	background: var(--MI_THEME-infoBg);
	color: var(--MI_THEME-infoFg);
	font-size: 0.9em;
	font-weight: 700;
}
</style>
