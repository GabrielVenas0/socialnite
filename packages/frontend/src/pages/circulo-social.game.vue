<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root" class="_gaps">
	<div :class="$style.topo">
		<span>Fase {{ fase + 1 }} de 4 · {{ faseAtual.titulo }}</span>
		<MkButton small rounded @click="sair"><i class="ti ti-x"></i> Sair</MkButton>
	</div>

	<!-- Cartão de símbolos -->
	<div v-if="etapa === 'cartao'" class="_panel _gaps" :class="$style.tela">
		<div :class="$style.titulo">{{ faseAtual.titulo }}</div>
		<div :class="$style.legenda">Símbolos desta fase</div>
		<div :class="$style.simbolos">
			<template v-for="s in faseAtual.simbolos" :key="s.simbolo">
				<div :class="$style.simbolo">{{ s.simbolo }}</div>
				<div>
					<div :class="$style.simboloNome">{{ s.nome }}</div>
					<div :class="$style.simboloDescricao">{{ s.descricao }}</div>
					<div :class="$style.simboloExemplo">Ex.: {{ s.exemplo }}</div>
				</div>
			</template>
		</div>
		<div :class="$style.dica">{{ faseAtual.nota }}</div>
		<MkButton primary gradate large rounded :class="$style.botao" @click="comecarFase">Começar</MkButton>
		<div :class="$style.legenda">6 rodadas, da mais fácil para a mais difícil. A rodada n vale 10 × n pontos.</div>
	</div>

	<!-- Rodada -->
	<div v-else-if="etapa === 'rodada'" class="_panel _gaps" :class="$style.tela">
		<div :class="$style.linha"><span>Rodada {{ rodada + 1 }} de 6</span><span>vale {{ pontosDaRodada(rodada) }} pontos</span></div>
		<div :class="$style.barra"><span v-for="i in 6" :key="i" :style="{ background: corSegmento(i - 1) }"></span></div>
		<div :class="$style.linha"><span></span><span>fácil → difícil</span></div>

		<div v-if="pessoaAtual" :class="$style.pessoa">
			<span :class="$style.chip">
				<img v-if="pessoaAtual.avatarUrl" :src="pessoaAtual.avatarUrl" :class="$style.avatar" alt=""/>
				<span v-else :class="[$style.avatar, $style.iniciais]">{{ iniciais(pessoaAtual.nome) }}</span>
				{{ pessoaAtual.nome }}
			</span>
		</div>
		<div :class="$style.pergunta">{{ rodadaAtual.pergunta }}</div>
		<div :class="$style.dica">{{ rodadaAtual.dica }}</div>

		<div v-if="rodadaAtual.tipo === 'escolha'" :class="[$style.opcoes, opcoesCurtas ? $style.opcoesLado : null]">
			<button
				v-for="(o, i) in rodadaAtual.opcoes"
				:key="i"
				class="_button"
				:class="[$style.opcao, opcoesCurtas ? $style.opcaoGrande : null, estadoOpcao(i) === 'certa' ? $style.opcaoCerta : estadoOpcao(i) === 'errada' ? $style.opcaoErrada : null]"
				:disabled="respondida"
				@click="escolher(i)"
			>
				{{ o }}
			</button>
		</div>

		<template v-else-if="rodadaAtual.tipo === 'regiao'">
			<svg ref="vennEl" viewBox="0 0 280 190" :class="$style.venn" role="img" aria-label="Diagrama de Venn com os conjuntos S e G" @click="tocarVenn">
				<defs>
					<clipPath id="cs-dentroS"><circle cx="105" cy="100" r="62"/></clipPath>
					<mask id="cs-foraG"><rect width="280" height="190" fill="white"/><circle cx="175" cy="100" r="62" fill="black"/></mask>
					<mask id="cs-foraS"><rect width="280" height="190" fill="white"/><circle cx="105" cy="100" r="62" fill="black"/></mask>
					<mask id="cs-foraSG"><rect width="280" height="190" fill="white"/><circle cx="105" cy="100" r="62" fill="black"/><circle cx="175" cy="100" r="62" fill="black"/></mask>
				</defs>
				<rect x="4" y="4" width="272" height="182" rx="8" :style="{ fill: 'none', stroke: 'var(--MI_THEME-divider)', strokeWidth: 1.5 }"/>
				<rect x="4" y="4" width="272" height="182" rx="8" mask="url(#cs-foraSG)" :style="estiloRegiao('fora')"/>
				<circle cx="105" cy="100" r="62" mask="url(#cs-foraG)" :style="estiloRegiao('s')"/>
				<circle cx="175" cy="100" r="62" mask="url(#cs-foraS)" :style="estiloRegiao('g')"/>
				<circle cx="175" cy="100" r="62" clip-path="url(#cs-dentroS)" :style="estiloRegiao('sg')"/>
				<circle cx="105" cy="100" r="62" :style="{ fill: 'none', stroke: '#7B5CF0', strokeWidth: 2.5 }"/>
				<circle cx="175" cy="100" r="62" :style="{ fill: 'none', stroke: '#1FB58F', strokeWidth: 2.5 }"/>
				<text x="12" y="22" :class="$style.vennRotulo">U</text>
				<text x="48" y="28" :class="$style.vennRotulo">S: te seguem</text>
				<text x="160" y="28" :class="$style.vennRotulo">G: você segue</text>
				<g v-if="respondida" style="pointer-events: none;">
					<text v-for="(n, i) in nomesNoVenn" :key="i" :x="n.x" :y="n.y" :text-anchor="n.ancora" :class="$style.vennNome">{{ n.texto }}</text>
				</g>
			</svg>
			<MkButton v-if="rodadaAtual.resposta.length > 1 && !respondida" rounded :class="$style.botao" @click="confirmarRegioes">Confirmar</MkButton>
		</template>

		<template v-else>
			<div :class="$style.proposicoes">
				<div><b>p</b> = {{ rodadaAtual.p }}</div>
				<div><b>q</b> = {{ rodadaAtual.q }}</div>
			</div>
			<table :class="$style.tabela">
				<thead><tr><th>p</th><th>q</th><th>p ∧ q</th><th></th></tr></thead>
				<tbody>
					<tr v-for="(l, i) in LINHAS" :key="i" :class="i === rodadaAtual.linha ? $style.linhaDestacada : null">
						<td>{{ vf(l[0]) }}</td>
						<td>{{ vf(l[1]) }}</td>
						<td>
							<button class="_button" :class="[$style.celula, estadoCelula(i) === 'certa' ? $style.opcaoCerta : estadoCelula(i) === 'errada' ? $style.opcaoErrada : null]" :disabled="respondida" @click="alternarCelula(i)">
								{{ tabela[i] == null ? '?' : vf(tabela[i]!) }}
							</button>
						</td>
						<td :class="$style.rotuloLinha">{{ i === rodadaAtual.linha ? rodadaAtual.rotuloLinha : '' }}</td>
					</tr>
				</tbody>
			</table>
			<MkButton v-if="!respondida" rounded :class="$style.botao" @click="confirmarTabela">Confirmar</MkButton>
		</template>

		<div v-if="erro" :class="$style.erro">{{ erro }}</div>
		<div v-if="respondida" :class="$style.retorno">
			<b :style="{ color: acertou ? 'var(--MI_THEME-success)' : 'var(--MI_THEME-error)' }">{{ acertou ? `Certo! +${pontosDaRodada(rodada)} pontos.` : 'Não foi dessa vez.' }}</b>
			{{ rodadaAtual.explicacao }}
		</div>
		<MkButton v-if="respondida" primary rounded :class="$style.botao" @click="proxima">{{ rodada < 5 ? 'Próxima rodada' : 'Ver resultado da fase' }}</MkButton>

		<!-- Dica: o mesmo cartão de símbolos do começo da fase, para consultar durante a rodada -->
		<button class="_button" :class="$style.botaoDica" :aria-expanded="mostrarDica" @click="mostrarDica = !mostrarDica">
			<i class="ti ti-bulb"></i> {{ mostrarDica ? 'Esconder a dica' : 'Dica: rever os símbolos da fase' }}
		</button>
		<div v-if="mostrarDica" class="_gaps_s" :class="$style.painelDica">
			<div :class="$style.simbolos">
				<template v-for="s in faseAtual.simbolos" :key="s.simbolo">
					<div :class="$style.simbolo">{{ s.simbolo }}</div>
					<div>
						<div :class="$style.simboloNome">{{ s.nome }}</div>
						<div :class="$style.simboloDescricao">{{ s.descricao }}</div>
						<div :class="$style.simboloExemplo">Ex.: {{ s.exemplo }}</div>
					</div>
				</template>
			</div>
			<div :class="$style.legenda">{{ faseAtual.nota }}</div>
		</div>
	</div>

	<!-- Fim da fase -->
	<div v-else-if="etapa === 'fimFase'" class="_panel _gaps" :class="$style.tela">
		<div :class="$style.titulo">Fase {{ fase + 1 }} concluída</div>
		<div :class="$style.pontos">{{ pontos[fase] }} de {{ MAXIMO_POR_FASE }} pontos</div>
		<div :class="$style.estrelas">
			<span v-for="i in 3" :key="i" :class="i <= estrelas(pontos[fase]) ? $style.estrelaAcesa : $style.estrelaApagada">★</span>
		</div>
		<div :class="$style.legenda">Total até agora: {{ total }} de {{ MAXIMO_TOTAL }}</div>
		<MkButton primary gradate large rounded :class="$style.botao" @click="proximaFase">{{ fase < 3 ? `Ir para a fase ${fase + 2}` : 'Ver resultado final' }}</MkButton>
	</div>

	<!-- Resultado final -->
	<div v-else class="_panel _gaps" :class="$style.tela">
		<div :class="$style.titulo">Partida completa!</div>
		<div :class="$style.pontos">{{ total }} de {{ MAXIMO_TOTAL }} pontos</div>
		<div class="_gaps_s">
			<div v-for="(f, i) in fases" :key="i" :class="$style.resumoFase">
				<span>Fase {{ i + 1 }} · {{ f.titulo }}</span>
				<span>{{ pontos[i] }} <span :class="$style.estrelaAcesa">{{ '★'.repeat(estrelas(pontos[i])) }}</span></span>
			</div>
		</div>
		<div :class="$style.legenda">{{ mensagemRanking }}</div>
		<MkButton primary gradate rounded :class="$style.botao" @click="jogarDeNovo">Jogar de novo</MkButton>
		<MkButton rounded :class="$style.botao" @click="sair">Voltar ao início</MkButton>
	</div>

	<!-- Ranking da semana: aparece no fim de cada fase e no resultado final (documentação, Parte I, seção 4) -->
	<div v-if="etapa === 'fimFase' || (etapa === 'final' && rankingPronto)" class="_panel" :class="$style.tela">
		<XRanking :key="`${etapa}-${fase}`"/>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import XRanking from './circulo-social.ranking.vue';
import type { Rede, Pessoa } from '@/utility/circulo-social/dados.js';
import type { Regiao } from '@/utility/circulo-social/conjuntos.js';
import type { Fase, RodadaRegiao, RodadaTabela } from '@/utility/circulo-social/rodadas.js';
import MkButton from '@/components/MkButton.vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import { REGIOES, elementosDaRegiao } from '@/utility/circulo-social/conjuntos.js';
import { LINHAS, vf } from '@/utility/circulo-social/logica.js';
import { MAXIMO_POR_FASE, MAXIMO_TOTAL, estrelas, montarFases, pontosDaRodada } from '@/utility/circulo-social/rodadas.js';
import { guardarRecorde, MODO_DO_RANKING, VERSAO_DO_JOGO } from '@/utility/circulo-social/recorde.js';

const props = defineProps<{
	rede: Rede;
}>();

const emit = defineEmits<{
	(ev: 'end'): void;
}>();

type Etapa = 'cartao' | 'rodada' | 'fimFase' | 'final';
// As classes dos estados ficam no template: o plugin que encurta as classes do
// CSS module (rollup-plugin-unwind-css-module-class-name) só enxerga $style lá.
type Estado = 'certa' | 'errada' | null;

// A partida usa a rede do momento em que começou.
function novasFases(): Fase[] {
	return montarFases(props.rede);
}

const fases = ref<Fase[]>(novasFases());
const fase = ref(0);
const rodada = ref(0);
const etapa = ref<Etapa>('cartao');
const pontos = ref([0, 0, 0, 0]);
const resultados = ref<boolean[][]>([[], [], [], []]);
// O registro no ranking exige o horário de início da partida como semente.
const semente = ref(Date.now().toString());
const mensagemRanking = ref('');
// No resultado final, o ranking só aparece depois do envio, para já trazer a pontuação nova.
const rankingPronto = ref(false);

// Estado da rodada atual
const respondida = ref(false);
const acertou = ref(false);
const escolhida = ref<number | null>(null);
const selecionadas = ref<Regiao[]>([]);
const tabela = ref<(boolean | null)[]>([null, null, null, null]);
const erro = ref('');
const vennEl = ref<SVGSVGElement | null>(null);
// Painel "Dica" da rodada: fica aberto entre as rodadas e fecha quando começa outra fase.
const mostrarDica = ref(false);

const faseAtual = computed(() => fases.value[fase.value]);
const rodadaAtual = computed(() => faseAtual.value.rodadas[rodada.value]);
const total = computed(() => pontos.value.reduce((a, b) => a + b, 0));

const pessoaAtual = computed((): Pessoa | null => {
	const r = rodadaAtual.value;
	if (r.tipo === 'tabela' || r.pessoa == null) return null;
	return props.rede.pessoas.get(r.pessoa) ?? null;
});

const opcoesCurtas = computed(() => {
	const r = rodadaAtual.value;
	return r.tipo === 'escolha' && r.opcoes.every(o => o.length <= 3);
});

function iniciais(nome: string): string {
	return nome.replace(/^@/, '').slice(0, 2).toUpperCase();
}

function corSegmento(i: number): string {
	const feito = i < rodada.value || (i === rodada.value && respondida.value);
	if (feito) return resultados.value[fase.value][i] ? 'var(--MI_THEME-success)' : 'var(--MI_THEME-error)';
	return i === rodada.value ? 'var(--MI_THEME-accent)' : 'var(--MI_THEME-divider)';
}

function responder(certo: boolean) {
	respondida.value = true;
	acertou.value = certo;
	resultados.value[fase.value][rodada.value] = certo;
	if (certo) pontos.value[fase.value] += pontosDaRodada(rodada.value);
}

// ---- rodadas de escolha ----
function escolher(i: number) {
	const r = rodadaAtual.value;
	if (respondida.value || r.tipo !== 'escolha') return;
	escolhida.value = i;
	responder(i === r.resposta);
}

function estadoOpcao(i: number): Estado {
	const r = rodadaAtual.value;
	if (!respondida.value || r.tipo !== 'escolha') return null;
	if (i === r.resposta) return 'certa';
	if (i === escolhida.value) return 'errada';
	return null;
}

// ---- rodadas no diagrama de Venn ----
// O toque é comparado com os dois círculos: dentro de um círculo é distância
// ao centro menor ou igual ao raio. A região é a conjunção das duas pertinências.
function tocarVenn(ev: MouseEvent) {
	const r = rodadaAtual.value;
	const svg = vennEl.value;
	if (respondida.value || r.tipo !== 'regiao' || svg == null) return;
	const ctm = svg.getScreenCTM();
	if (ctm == null) return;
	const ponto = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(ctm.inverse());
	const emS = Math.hypot(ponto.x - 105, ponto.y - 100) <= 62;
	const emG = Math.hypot(ponto.x - 175, ponto.y - 100) <= 62;
	const regiao: Regiao = emS && emG ? 'sg' : emS ? 's' : emG ? 'g' : 'fora';
	erro.value = '';
	if (r.resposta.length === 1) {
		selecionadas.value = [regiao];
		responder(regiao === r.resposta[0]);
	} else {
		selecionadas.value = selecionadas.value.includes(regiao)
			? selecionadas.value.filter(x => x !== regiao)
			: [...selecionadas.value, regiao];
	}
}

function confirmarRegioes() {
	const r = rodadaAtual.value as RodadaRegiao;
	if (selecionadas.value.length === 0) {
		erro.value = 'Toque em pelo menos uma parte do desenho antes de confirmar.';
		return;
	}
	responder(selecionadas.value.length === r.resposta.length && r.resposta.every(x => selecionadas.value.includes(x)));
}

function estiloRegiao(regiao: Regiao): Record<string, string | number> {
	const r = rodadaAtual.value;
	const marcada = selecionadas.value.includes(regiao);
	if (respondida.value && r.tipo === 'regiao') {
		if (r.resposta.includes(regiao)) return { fill: '#F5A623', fillOpacity: 0.5 };
		if (marcada) return { fill: '#E5484D', fillOpacity: 0.35 };
	} else if (marcada) {
		return { fill: 'var(--MI_THEME-accent)', fillOpacity: 0.35 };
	}
	return { fill: 'transparent', fillOpacity: 0 };
}

const nomesNoVenn = computed(() => {
	const { S, G, U } = props.rede;
	const curto = (id: string) => {
		const t = (props.rede.pessoas.get(id)?.nome ?? id).replace(/^@/, '');
		return t.length > 9 ? `${t.slice(0, 8)}…` : t;
	};
	const nomes = Object.fromEntries(REGIOES.map(reg => [reg, [...elementosDaRegiao(reg, S, G, U)].map(curto)])) as Record<Regiao, string[]>;
	const saida: { x: number; y: number; texto: string; ancora: 'start' | 'middle' | 'end' }[] = [];
	const colunas = { s: 70, sg: 140, g: 210 } as const;
	for (const reg of ['s', 'sg', 'g'] as const) {
		const lista = nomes[reg].length > 3 ? [...nomes[reg].slice(0, 2), `+${nomes[reg].length - 2}`] : nomes[reg];
		lista.forEach((texto, i) => saida.push({ x: colunas[reg], y: 104 - (lista.length - 1) * 6.5 + i * 13, texto, ancora: 'middle' }));
	}
	const fora = nomes.fora.length > 4 ? [...nomes.fora.slice(0, 3), `+${nomes.fora.length - 3}`] : nomes.fora;
	const lugares = [
		{ x: 10, y: 168, ancora: 'start' as const }, { x: 10, y: 181, ancora: 'start' as const },
		{ x: 270, y: 168, ancora: 'end' as const }, { x: 270, y: 181, ancora: 'end' as const },
	];
	fora.forEach((texto, i) => saida.push({ ...lugares[i], texto }));
	return saida;
});

// ---- tabela-verdade ----
function alternarCelula(i: number) {
	if (respondida.value) return;
	tabela.value[i] = tabela.value[i] !== true;
	erro.value = '';
}

function confirmarTabela() {
	const r = rodadaAtual.value as RodadaTabela;
	if (tabela.value.includes(null)) {
		erro.value = 'Preencha as 4 linhas antes de confirmar.';
		return;
	}
	responder(tabela.value.every((v, i) => v === r.resposta[i]));
}

function estadoCelula(i: number): Estado {
	const r = rodadaAtual.value;
	if (!respondida.value || r.tipo !== 'tabela') return null;
	return tabela.value[i] === r.resposta[i] ? 'certa' : 'errada';
}

// ---- andamento da partida ----
function limparRodada() {
	respondida.value = false;
	acertou.value = false;
	escolhida.value = null;
	selecionadas.value = [];
	tabela.value = [null, null, null, null];
	erro.value = '';
}

function comecarFase() {
	rodada.value = 0;
	limparRodada();
	mostrarDica.value = false;
	etapa.value = 'rodada';
}

function proxima() {
	if (rodada.value < 5) {
		rodada.value++;
		limparRodada();
	} else {
		etapa.value = 'fimFase';
	}
}

function proximaFase() {
	if (fase.value < 3) {
		fase.value++;
		etapa.value = 'cartao';
	} else {
		etapa.value = 'final';
		encerrar();
	}
}

async function encerrar() {
	guardarRecorde(total.value);
	if (props.rede.ficticia) {
		mensagemRanking.value = 'No modo Turma fictícia a pontuação não vai para o ranking.';
		rankingPronto.value = true;
		return;
	}
	mensagemRanking.value = 'Enviando a pontuação para o ranking…';
	try {
		await misskeyApi('bubble-game/register', {
			seed: semente.value,
			score: total.value,
			gameMode: MODO_DO_RANKING,
			gameVersion: VERSAO_DO_JOGO,
			logs: resultados.value.flatMap((rs, f) => rs.map((certo, r) => [f + 1, r + 1, certo ? 1 : 0])),
		});
		mensagemRanking.value = 'Pontuação enviada para o ranking da semana do Nite Games.';
	} catch {
		mensagemRanking.value = 'Não deu para enviar a pontuação agora. Tente de novo em outra partida.';
	}
	rankingPronto.value = true;
}

function jogarDeNovo() {
	fases.value = novasFases();
	fase.value = 0;
	pontos.value = [0, 0, 0, 0];
	resultados.value = [[], [], [], []];
	semente.value = Date.now().toString();
	mensagemRanking.value = '';
	rankingPronto.value = false;
	limparRodada();
	etapa.value = 'cartao';
}

function sair() {
	emit('end');
}
</script>

<style lang="scss" module>
.root {
	max-width: 520px;
	margin: 0 auto;
	user-select: none;
	// nomes longos (ex.: @alguem@outro.servidor) quebram a linha em vez de estourar a tela do celular
	overflow-wrap: anywhere;
}

.topo {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	font-size: 0.9em;
	opacity: 0.8;
}

.tela {
	padding: 20px;
}

.titulo {
	font-size: 1.4em;
	font-weight: bold;
	text-align: center;
}

.legenda {
	font-size: 0.85em;
	opacity: 0.7;
	text-align: center;
}

.simbolos {
	display: grid;
	grid-template-columns: 52px 1fr;
	gap: 10px 12px;
	align-items: center;
}

.simbolo {
	font-size: 1.7em;
	font-weight: bold;
	text-align: center;
	color: var(--MI_THEME-accent);
}

.simboloNome {
	font-weight: bold;
}

.simboloDescricao {
	font-size: 0.9em;
	opacity: 0.75;
}

.simboloExemplo {
	font-size: 0.85em;
	color: var(--MI_THEME-accent);
}

.dica {
	background: var(--MI_THEME-accentedBg);
	color: var(--MI_THEME-accent);
	border-radius: 10px;
	padding: 10px 12px;
	font-size: 0.9em;
	line-height: 1.5;
}

.botao {
	width: 100%;
}

// A documentação pede botões com pelo menos 48 px de altura, para o toque no
// celular. Três classes para vencer o padding do MkButton (.root.large).
.root .tela .botao {
	padding-top: 16px;
	padding-bottom: 16px;
}

.botaoDica {
	align-self: center;
	display: inline-flex;
	align-items: center;
	gap: 6px;
	min-height: 48px;
	padding: 0 16px;
	border-radius: 999px;
	font-size: 0.9em;
	color: var(--MI_THEME-accent);

	&:hover {
		background: var(--MI_THEME-accentedBg);
	}
}

.painelDica {
	padding: 12px;
	border: 1px dashed var(--MI_THEME-divider);
	border-radius: 10px;
}

.linha {
	display: flex;
	justify-content: space-between;
	font-size: 0.8em;
	opacity: 0.7;
}

.barra {
	display: grid;
	grid-template-columns: repeat(6, 1fr);
	gap: 4px;

	> span {
		height: 6px;
		border-radius: 3px;
	}
}

.pessoa {
	text-align: center;
}

.chip {
	display: inline-flex;
	align-items: center;
	gap: 8px;
	max-width: 100%;
	border: 1.5px solid var(--MI_THEME-divider);
	border-radius: 999px;
	padding: 4px 14px 4px 4px;
	font-size: 0.95em;
}

.avatar {
	width: 28px;
	height: 28px;
	border-radius: 50%;
	object-fit: cover;
}

.iniciais {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	background: var(--MI_THEME-accentedBg);
	color: var(--MI_THEME-accent);
	font-size: 0.7em;
	font-weight: bold;
}

.pergunta {
	font-size: 1.35em;
	font-weight: bold;
	text-align: center;
	line-height: 1.35;
}

.opcoes {
	display: grid;
	gap: 8px;
}

.opcoesLado {
	grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
	grid-auto-flow: column;
}

.opcao {
	min-height: 52px;
	padding: 10px 14px;
	border: 2px solid var(--MI_THEME-divider);
	border-radius: 12px;
	background: var(--MI_THEME-buttonBg);
	font-size: 1.05em;

	&:hover:not(:disabled) {
		background: var(--MI_THEME-buttonHoverBg);
	}
}

.opcaoGrande {
	font-size: 1.6em;
}

.opcaoCerta {
	border-color: var(--MI_THEME-success) !important;
	color: var(--MI_THEME-success);
}

.opcaoErrada {
	border-color: var(--MI_THEME-error) !important;
	color: var(--MI_THEME-error);
}

.venn {
	width: 100%;
	cursor: pointer;
	touch-action: manipulation;
}

.vennRotulo {
	font-size: 10px;
	fill: var(--MI_THEME-fg);
	opacity: 0.75;
}

.vennNome {
	font-size: 9.5px;
	font-weight: bold;
	fill: var(--MI_THEME-fg);
}

.proposicoes {
	font-size: 0.9em;
	line-height: 1.6;
}

.tabela {
	width: 100%;
	border-collapse: collapse;
	text-align: center;

	th, td {
		border: 1px solid var(--MI_THEME-divider);
		padding: 6px;
		font-weight: normal;
	}
}

.linhaDestacada td {
	background: var(--MI_THEME-accentedBg);
	color: var(--MI_THEME-accent);
}

.celula {
	width: 64px;
	height: 48px;
	border: 2px solid var(--MI_THEME-divider);
	border-radius: 8px;
	background: var(--MI_THEME-buttonBg);
	font-size: 1.05em;
	font-weight: bold;
}

.rotuloLinha {
	font-size: 0.8em;
	// nomes longos (ex.: @alguem@outro.servidor) quebram a linha em vez de alargar a tabela no celular
	overflow-wrap: anywhere;
}

.erro {
	color: var(--MI_THEME-error);
	font-size: 0.9em;
}

.retorno {
	line-height: 1.5;
}

.pontos {
	font-size: 1.6em;
	font-weight: bold;
	text-align: center;
}

.estrelas {
	text-align: center;
	font-size: 2.2em;
	letter-spacing: 6px;
}

.estrelaAcesa {
	color: #F5A623;
}

.estrelaApagada {
	color: var(--MI_THEME-divider);
}

.resumoFase {
	display: flex;
	justify-content: space-between;
	gap: 8px;
	padding: 6px 0;
	border-bottom: 1px solid var(--MI_THEME-divider);
}
</style>
