<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_gaps">
	<p :class="$style.intro">
		O Social Nite é uma comunidade pequena e por convite. Ao criar sua conta, você concorda com estas regras — elas são um resumo dos nossos Termos de Uso.
	</p>

	<ol :class="$style.rules">
		<li :class="$style.rule">
			<strong :class="$style.ruleTitle">Respeite as pessoas.</strong>
			<p :class="$style.ruleText">Trate todo mundo com educação, inclusive na discordância. Assédio, perseguição, ameaças e ataques pessoais não são tolerados.</p>
		</li>
		<li :class="$style.rule">
			<strong :class="$style.ruleTitle">Sem discurso de ódio.</strong>
			<p :class="$style.ruleText">Nada de conteúdo que ataque, humilhe ou incite violência contra pessoas por raça, etnia, religião, gênero, orientação sexual, deficiência ou origem.</p>
		</li>
		<li :class="$style.rule">
			<strong :class="$style.ruleTitle">Nada de conteúdo ilegal.</strong>
			<p :class="$style.ruleText">É proibido publicar qualquer material que viole a lei brasileira, incluindo conteúdo sexual envolvendo menores, apologia a crimes e material pirateado.</p>
		</li>
		<li :class="$style.rule">
			<strong :class="$style.ruleTitle">Marque o conteúdo sensível.</strong>
			<p :class="$style.ruleText">Nudez, violência gráfica e temas pesados só são permitidos com o aviso de conteúdo sensível ativado na Nota e no arquivo.</p>
		</li>
		<li :class="$style.rule">
			<strong :class="$style.ruleTitle">Seja você mesmo.</strong>
			<p :class="$style.ruleText">Contas falsas, personificação de outras pessoas ou instituições e uso de identidade alheia levam à remoção imediata da conta.</p>
		</li>
		<li :class="$style.rule">
			<strong :class="$style.ruleTitle">Proteja a privacidade dos outros.</strong>
			<p :class="$style.ruleText">Não exponha dados pessoais, fotos ou prints de Conversas de terceiros sem autorização de quem aparece neles.</p>
		</li>
		<li :class="$style.rule">
			<strong :class="$style.ruleTitle">Sem spam nem autopromoção excessiva.</strong>
			<p :class="$style.ruleText">Divulgue seus projetos com moderação. Correntes, propaganda repetida e mensagens em massa nas Conversas serão removidas.</p>
		</li>
		<li :class="$style.rule">
			<strong :class="$style.ruleTitle">Use cada Canal para o tema dele.</strong>
			<p :class="$style.ruleText">Poste no Canal certo e mantenha as Redes de Palavras e as Redes de Pessoas livres de uso abusivo para inundar a linha do tempo.</p>
		</li>
		<li :class="$style.rule">
			<strong :class="$style.ruleTitle">O descumprimento tem consequências.</strong>
			<p :class="$style.ruleText">Conforme a gravidade, a moderação pode remover Notas, aplicar advertência, suspender ou excluir a conta — e o convite usado responde junto.</p>
		</li>
	</ol>
</div>
</template>

<script lang="ts" setup>
</script>

<style lang="scss" module>
.intro {
	margin: 0;
	padding: 0 0 16px 0;
	border-bottom: solid 1px var(--MI_THEME-divider);
	line-height: 1.7;
}

.rules {
	list-style: none;
	counter-reset: rule;
	margin: 0;
	padding: 0;
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.rule {
	counter-increment: rule;
	position: relative;
	background: var(--MI_THEME-panel);
	border-radius: 10px;
	padding: 16px 18px 16px 62px;
}

.rule::before {
	content: counter(rule);
	position: absolute;
	top: 16px;
	left: 16px;
	width: 30px;
	height: 30px;
	line-height: 30px;
	text-align: center;
	border-radius: 999px;
	background: var(--MI_THEME-accent);
	color: var(--MI_THEME-fgOnAccent);
	font-weight: 700;
	font-size: 0.9em;
}

.ruleTitle {
	display: block;
	line-height: 30px;
	font-size: 1.05em;
}

.ruleText {
	margin: 4px 0 0 0;
	line-height: 1.7;
	color: var(--MI_THEME-fgTransparentWeak);
}

@container (max-width: 500px) {
	.rule {
		padding: 14px 14px 14px 14px;
	}

	.rule::before {
		position: static;
		display: inline-block;
		margin-right: 8px;
		vertical-align: middle;
	}

	.ruleTitle {
		display: inline;
		line-height: 1.5;
	}
}
</style>
