<template>
<PageWithHeader>
	<div class="participants-page">
		<header class="page-heading">
			<h1>Participantes do NITE</h1>
			<p>NITE - Núcleo de Informação e Tecnologia</p>
			<MkButton class="refresh-button" rounded :disabled="refreshing" @click="carregar"><i :class="refreshing ? 'ti ti-loader-2 spin' : 'ti ti-refresh'"></i> Atualizar dados</MkButton>
		</header>

		<div v-if="loading" class="state-card" role="status"><i class="ti ti-loader-2 spin"></i> Carregando projetos e participantes...</div>
		<div v-else-if="error" class="state-card error-state" role="alert">
			<i class="ti ti-cloud-off"></i><strong>Não foi possível carregar os dados oficiais.</strong>
			<p>{{ error }}</p><p>Configure uma URL CSV pública em <code>VITE_NITE_PARTICIPANTS_CSV_URL</code> e atualize a página.</p>
			<MkButton rounded @click="carregar">Tentar novamente</MkButton>
		</div>
		<div v-else-if="projetos.length === 0" class="state-card">Nenhum projeto encontrado na fonte oficial.</div>
		<template v-else>
			<section class="panel selection-panel">
				<h2>Seleção dos projetos</h2>
				<div class="selectors">
					<label class="field"><span>Conjunto A</span><select v-model="projetoAId"><option value="" disabled>Selecione um projeto</option><option v-for="p in projetos" :key="p.id" :value="p.id">{{ p.nome }} · {{ p.obterParticipantes().length }}</option></select></label>
					<label class="field"><span>Conjunto B</span><select v-model="projetoBId"><option value="" disabled>Selecione um projeto</option><option v-for="p in projetos" :key="p.id" :value="p.id" :disabled="p.id === projetoAId">{{ p.nome }} · {{ p.obterParticipantes().length }}</option></select></label>
				</div>
				<p v-if="projetoAId && projetoAId === projetoBId" class="validation">Escolha projetos diferentes para os dois conjuntos.</p>
				<div class="selection-counts"><span>A <b>{{ conjuntoA.length }}</b> participantes</span><span>B <b>{{ conjuntoB.length }}</b> participantes</span></div>
			</section>

			<section class="panel operations-panel">
				<h2>Operação desejada</h2>
				<div class="operations">
					<button v-for="item in operacoes" :key="item.id" :class="{ selected: operacao === item.id }" :disabled="!pronto" @click="operacao = item.id">{{ item.nome }} <span>{{ item.simbolo }}</span></button>
				</div>
			</section>

			<section v-if="pronto && resultado" class="results">
				<h2>Resultado: {{ operacaoAtual.nome }} ({{ operacaoAtual.simbolo }})</h2>
				<div class="result-layout">
					<div class="panel diagram-panel"><NiteVennDiagram :projetoA="projetoANome" :projetoB="projetoBNome" :totalA="conjuntoA.length" :totalB="conjuntoB.length" :regioes="resultado.regioes" :destaque="operacao" /></div>
					<aside class="description"><h3>Descrição do conjunto</h3><p>{{ operacaoAtual.descricao }}</p><div class="active-result">{{ resultado.participantes.length }} participante{{ resultado.participantes.length === 1 ? '' : 's' }} no resultado</div></aside>
				</div>
				<div class="panel result-list">
					<div class="list-heading"><h3>Participantes do resultado</h3><span>{{ resultado.participantes.length }} total</span></div>
					<p v-if="resultado.participantes.length === 0" class="empty-result">Nenhum participante corresponde a esta operação.</p>
					<ul v-else><li v-for="p in resultado.participantes" :key="p.id"><span class="person-icon"><i class="ti ti-user"></i></span><span>{{ p.nome }}</span></li></ul>
				</div>
			</section>
			<div v-else class="state-card">Selecione dois projetos diferentes para visualizar as operações.</div>
		</template>
	</div>
</PageWithHeader>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import MkButton from '@/components/MkButton.vue';
import NiteVennDiagram from '@/components/NiteVennDiagram.vue';
import { GerenciadoraDeConjuntos } from '@/domain/nite-participants.js';
import type { OperacaoConjunto } from '@/domain/nite-participants.js';
import { FonteParticipantesNite } from '@/services/nite-participants.js';
import { definePage } from '@/page.js';
import { i18n } from '@/i18n.js';
import type { Projeto } from '@/domain/nite-participants.js';

const operacoes: { id: OperacaoConjunto; nome: string; simbolo: string; descricao: string }[] = [
	{ id: 'union', nome: 'União', simbolo: 'A ∪ B', descricao: 'Representa todos os participantes que pertencem ao Conjunto A, ao Conjunto B ou a ambos, sem repetição.' },
	{ id: 'intersection', nome: 'Interseção', simbolo: 'A ∩ B', descricao: 'Representa os participantes que pertencem simultaneamente aos dois projetos selecionados.' },
	{ id: 'difference', nome: 'Diferença', simbolo: 'A − B', descricao: 'Representa exclusivamente os participantes que pertencem ao Conjunto A e não pertencem ao Conjunto B.' },
	{ id: 'reverse-difference', nome: 'Diferença', simbolo: 'B − A', descricao: 'Representa exclusivamente os participantes que pertencem ao Conjunto B e não pertencem ao Conjunto A.' },
];
const fonte = new FonteParticipantesNite();
const gerente = new GerenciadoraDeConjuntos();
const projetos = ref<Projeto[]>([]);
const loading = ref(true);
const refreshing = ref(false);
const hasLoaded = ref(false);
const error = ref('');
const projetoAId = ref('');
const projetoBId = ref('');
const operacao = ref<OperacaoConjunto>('intersection');
const projetoA = computed(() => projetos.value.find((p) => p.id === projetoAId.value));
const projetoB = computed(() => projetos.value.find((p) => p.id === projetoBId.value));
const conjuntoA = computed(() => projetoA.value?.obterParticipantes() ?? []);
const conjuntoB = computed(() => projetoB.value?.obterParticipantes() ?? []);
const pronto = computed(() => !!projetoA.value && !!projetoB.value && projetoAId.value !== projetoBId.value);
const resultado = computed(() => pronto.value && projetoA.value && projetoB.value ? gerente.calcular(projetoA.value, projetoB.value, operacao.value) : null);
const operacaoAtual = computed(() => operacoes.find((item) => item.id === operacao.value)!);
const projetoANome = computed(() => projetoA.value?.nome ?? 'Conjunto A');
const projetoBNome = computed(() => projetoB.value?.nome ?? 'Conjunto B');

async function carregar() {
	if (!hasLoaded.value) loading.value = true;
	refreshing.value = true;
	error.value = '';
	const selecaoAnteriorA = projetoAId.value;
	const selecaoAnteriorB = projetoBId.value;
	try {
		projetos.value = await fonte.carregar();
		// A página começa com ambos os conjuntos vazios. Durante atualizações de dados
		// na mesma sessão, preservamos apenas as seleções que ainda são válidas.
		projetoAId.value = projetos.value.some((p) => p.id === selecaoAnteriorA) ? selecaoAnteriorA : '';
		projetoBId.value = projetos.value.some((p) => p.id === selecaoAnteriorB && p.id !== projetoAId.value) ? selecaoAnteriorB : '';
	} catch (err) {
		error.value = err instanceof Error ? err.message : 'Ocorreu um erro ao consultar a fonte de dados.';
	} finally { loading.value = false; refreshing.value = false; hasLoaded.value = true; }
}

let refreshTimer: number | undefined;
onMounted(() => {
	void carregar();
	refreshTimer = window.setInterval(() => { void carregar(); }, 5 * 60 * 1000);
});
onUnmounted(() => { if (refreshTimer !== undefined) window.clearInterval(refreshTimer); });

definePage(() => ({ title: 'Participantes do NITE', icon: 'ti ti-users-group' }));
</script>

<style lang="scss" scoped>
.participants-page { box-sizing: border-box; width: min(100%, 1080px); margin: 0 auto; padding: 32px clamp(16px, 4vw, 44px) 56px; }
.page-heading { text-align: center; margin: 0 0 28px; }
.page-heading h1 { margin: 0; font-size: clamp(1.7rem, 4vw, 2.35rem); }
.page-heading p { margin: 7px 0 0; opacity: .72; font-size: 1.08rem; }
.refresh-button { margin-top: 14px; }
.panel, .state-card { background: var(--MI_THEME-panel); border: 1px solid var(--MI_THEME-divider); border-radius: 18px; box-shadow: 0 8px 30px rgb(0 0 0 / 12%); }
.panel { padding: clamp(18px, 3vw, 28px); margin-bottom: 18px; }
h2 { margin: 0 0 18px; text-transform: uppercase; letter-spacing: .035em; font-size: .97rem; }
.selectors { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
.field { display: grid; gap: 9px; font-weight: 650; }
.field select { width: 100%; min-width: 0; padding: 13px 15px; color: var(--MI_THEME-fg); background: var(--MI_THEME-panel); border: 1px solid var(--MI_THEME-divider); border-radius: 12px; font: inherit; }
.field select:focus { outline: 2px solid #9b4dff; outline-offset: 1px; }
.field option:disabled { color: var(--MI_THEME-fgTransparentWeak); }
.selection-counts { display: flex; gap: 10px; margin-top: 14px; color: var(--MI_THEME-fgTransparentWeak); font-size: .88em; }
.selection-counts span { padding: 6px 10px; background: var(--MI_THEME-panelHighlight); border-radius: 9px; }
.selection-counts b { color: var(--MI_THEME-fg); }
.validation { margin: 12px 0 0; color: #ff9baf; }
.operations { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.operations button { cursor: pointer; border: 1px solid transparent; border-radius: 999px; padding: 13px 12px; background: var(--MI_THEME-panelHighlight); color: var(--MI_THEME-fg); font: inherit; transition: background .18s, border-color .18s, transform .18s; }
.operations button:hover:not(:disabled) { transform: translateY(-1px); border-color: #b53dff; }
.operations button.selected { border-color: #c14aff; box-shadow: inset 0 0 0 1px #a94bff; background: linear-gradient(105deg, rgb(121 57 235 / 24%), rgb(222 49 183 / 22%)); }
.operations button:disabled { opacity: .5; cursor: not-allowed; }
.operations button span { opacity: .85; }
.results h2 { font-size: 1.3rem; text-transform: none; margin: 28px 0 18px; }
.result-layout { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(240px, .8fr); gap: 18px; align-items: center; }
.diagram-panel { min-width: 0; margin: 0; padding: 20px 12px 6px; }
.description { border: 1px solid transparent; border-radius: 18px; padding: 22px; background: linear-gradient(var(--MI_THEME-panel), var(--MI_THEME-panel)) padding-box, linear-gradient(135deg, #8538ff, #e43ca9) border-box; }
.description h3 { margin: 0 0 10px; }
.description p { line-height: 1.55; margin: 0; }
.active-result { margin-top: 20px; color: #d98aff; font-weight: 700; }
.result-list { margin-top: 18px; }
.list-heading { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.list-heading h3 { margin: 0; font-size: 1rem; }
.list-heading span { color: var(--MI_THEME-fgTransparentWeak); }
.result-list ul { list-style: none; margin: 14px 0 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 8px; }
.result-list li { min-width: 0; padding: 10px 12px; background: var(--MI_THEME-panelHighlight); border-radius: 10px; display: flex; align-items: center; gap: 10px; overflow-wrap: anywhere; }
.person-icon { color: #d17cff; }
.empty-result { margin: 18px 0 0; color: var(--MI_THEME-fgTransparentWeak); }
.state-card { padding: 26px; text-align: center; }
.error-state { display: grid; justify-items: center; gap: 9px; }
.error-state > i { font-size: 2rem; color: #d57aff; }
.error-state p { margin: 0; max-width: 620px; overflow-wrap: anywhere; }
.error-state code { font-size: .9em; }
.spin { display: inline-block; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 760px) { .result-layout { grid-template-columns: 1fr; } .operations { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 560px) { .participants-page { padding-top: 22px; } .selectors { grid-template-columns: 1fr; gap: 14px; } .operations { grid-template-columns: 1fr; gap: 8px; } .operations button { text-align: left; } .selection-counts { flex-wrap: wrap; } }
</style>
