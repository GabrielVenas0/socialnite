<template>
<section class="venn" aria-label="Diagrama de Venn dos participantes">
	<div class="project-label project-label-a">Conjunto A · {{ projetoA }}</div>
	<div class="project-label project-label-b">Conjunto B · {{ projetoB }}</div>
	<div class="venn-circles">
		<div class="circle circle-a" :class="{ dimmed: destaque === 'intersection' || destaque === 'reverse-difference' }">
			<strong>{{ regioes['a-only'].length }}</strong><span>exclusivos de A</span>
			<ul v-if="regioes['a-only'].length <= 5"><li v-for="p in regioes['a-only']" :key="p.id">{{ p.nome }}</li></ul>
		</div>
		<div class="circle circle-b" :class="{ dimmed: destaque === 'intersection' || destaque === 'difference' }">
			<strong>{{ regioes['b-only'].length }}</strong><span>exclusivos de B</span>
			<ul v-if="regioes['b-only'].length <= 5"><li v-for="p in regioes['b-only']" :key="p.id">{{ p.nome }}</li></ul>
		</div>
		<div class="intersection" :class="{ dimmed: destaque === 'difference' || destaque === 'reverse-difference' }">
			<strong>{{ regioes.intersection.length }}</strong><span>em comum</span>
			<ul v-if="regioes.intersection.length <= 5"><li v-for="p in regioes.intersection" :key="p.id">{{ p.nome }}</li></ul>
		</div>
	</div>
	<p class="region-summary">A: {{ totalA }} participantes <span>·</span> B: {{ totalB }} participantes</p>
</section>
</template>

<script setup lang="ts">
import type { OperacaoConjunto, Participante, RegiaoDiagramaVenn } from '@/domain/nite-participants.js';

defineProps<{
	projetoA: string;
	projetoB: string;
	totalA: number;
	totalB: number;
	regioes: Record<RegiaoDiagramaVenn, Participante[]>;
	destaque: OperacaoConjunto;
}>();
</script>

<style lang="scss" scoped>
.venn { min-width: 0; }
.project-label { font-weight: 700; text-align: center; margin-bottom: 8px; }
.project-label-a { color: #ff6e9c; }
.project-label-b { color: #69b7ff; }
.venn-circles { position: relative; display: flex; align-items: center; justify-content: center; min-height: 300px; }
.circle { width: min(48%, 300px); aspect-ratio: 1; border: 3px solid; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; transition: opacity .2s, filter .2s; padding: 20px 44px; }
.circle-a { margin-right: -10%; border-color: #ff6e9c; background: rgb(239 73 127 / 35%); z-index: 1; }
.circle-b { margin-left: -10%; border-color: #62b6ff; background: rgb(51 146 227 / 35%); }
.circle strong, .intersection strong { font-size: 1.35em; }
.circle span, .intersection span { font-size: .75em; opacity: .82; }
.circle ul, .intersection ul { margin: 7px 0 0; padding: 0; list-style: none; max-height: 82px; overflow: hidden; font-size: .76em; }
.intersection { position: absolute; z-index: 2; display: flex; flex-direction: column; align-items: center; justify-content: center; width: 22%; min-width: 70px; text-align: center; transition: opacity .2s; }
.dimmed { opacity: .4; filter: saturate(.55); }
.region-summary { text-align: center; color: var(--MI_THEME-fgTransparentWeak); font-size: .9em; }
@media (max-width: 600px) { .venn-circles { min-height: 235px; } .circle { padding: 12px 28px; } .circle ul { font-size: .66em; } }
</style>
