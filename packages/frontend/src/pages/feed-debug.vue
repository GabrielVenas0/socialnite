<!--
SPDX-FileCopyrightText: syuilo and misskey-project (SocialNite fork)
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader>
	<div class="_spacer" style="--MI_SPACER-w: 960px;">
		<div class="_gaps_m">
			<h2>Feed debug</h2>
			<p style="opacity: 0.8;">
				Fórmula de elegibilidade:
				<code>E = (p_follow ∨ p_interest) ∧ ¬p_nsfw ∧ ¬p_muted</code>
			</p>

			<MkLoading v-if="loading" />

			<div v-else-if="disabled">
				<p class="disabled-message">
					Funcionalidade desativada no servidor (flag SET_BASED_FEED_ENABLED=false).
					Ative-a no backend para usar esta página.
				</p>
			</div>

			<div v-else-if="error">
				<MkResult type="error" :text="errorMessage" />
			</div>

			<template v-else>
				<section class="_gaps_m">
					<h3>Resumo</h3>
					<table class="summary">
						<tbody>
							<tr><th>U</th><td>{{ sizes.U }}</td></tr>
							<tr><th>F</th><td>{{ sizes.F }}</td></tr>
							<tr><th>I</th><td>{{ sizes.I }}</td></tr>
							<tr><th>S</th><td>{{ sizes.S }}</td></tr>
							<tr><th>M</th><td>{{ sizes.M }}</td></tr>
							<tr><th>V</th><td>{{ sizes.V }}</td></tr>
						</tbody>
					</table>
				</section>

				<section v-if="rows.length === 0" class="_gaps_m">
					<MkResult type="empty" text="Feed vazio: nenhum post no lote (U) retornado pelo endpoint." />
				</section>

				<section v-else class="_gaps_m">
					<h3>Posts do lote (U)</h3>
					<div style="overflow-x: auto;">
						<table class="rows">
							<thead>
								<tr>
									<th>id</th>
									<th>p_follow</th>
									<th>p_interest</th>
									<th>p_nsfw</th>
									<th>p_muted</th>
									<th>E</th>
									<th>Eliminado por</th>
								</tr>
							</thead>
							<tbody>
								<tr v-for="row in rows" :key="row.noteId">
									<td class="note-id">{{ row.noteId }}</td>
									<td>{{ row.p_follow ? '1' : '0' }}</td>
									<td>{{ row.p_interest ? '1' : '0' }}</td>
									<td>{{ row.p_nsfw ? '1' : '0' }}</td>
									<td>{{ row.p_muted ? '1' : '0' }}</td>
									<td>{{ row.E ? '✓' : '✗' }}</td>
									<td>{{ row.E ? '—' : (row.excludedBy ?? '—') }}</td>
								</tr>
							</tbody>
						</table>
					</div>
				</section>
			</template>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { misskeyApi } from '@/utility/misskey-api.js';
import PageWithHeader from '@/components/global/PageWithHeader.vue';
import MkLoading from '@/components/global/MkLoading.vue';
import MkResult from '@/components/global/MkResult.vue';
import { definePage } from '@/page.js';

interface FeedRow {
	noteId: string;
	p_follow: boolean;
	p_interest: boolean;
	p_nsfw: boolean;
	p_muted: boolean;
	E: boolean;
	excludedBy: string | null;
}

interface FeedDebugResponse {
	items: unknown[];
	debug?: {
		sizes: { U: number; F: number; I: number; S: number; M: number; V: number; };
		rows?: FeedRow[];
	};
}

const loading = ref(true);
const disabled = ref(false);
const error = ref(false);
const errorMessage = ref('');
const sizes = ref({ U: 0, F: 0, I: 0, S: 0, M: 0, V: 0 });
const rows = ref<FeedRow[]>([]);

async function load() {
	loading.value = true;
	disabled.value = false;
	error.value = false;
	errorMessage.value = '';

	try {
		const res = await misskeyApi<FeedDebugResponse>(
			'notes/feed-timeline' as any,
			{ limit: 20, debug: true } as any,
		);
		sizes.value = res?.debug?.sizes ?? sizes.value;
		rows.value = res?.debug?.rows ?? [];
	} catch (e: any) {
		if (e?.code === 'SET_BASED_FEED_DISABLED') {
			disabled.value = true;
		} else {
			error.value = true;
			errorMessage.value = e?.message ?? 'Falha ao carregar o feed de depuração.';
		}
	} finally {
		loading.value = false;
	}
}

onMounted(load);

definePage(() => ({
	title: 'Feed debug',
	icon: 'ti ti-bug',
}));
</script>

<style lang="scss" module>
/* estilos globais via classes simples */
</style>

<style lang="scss">
.summary,
.rows {
	width: 100%;
	border-collapse: collapse;
	font-size: 90%;

	th, td {
		border: 1px solid var(--MI_THEME-divider);
		padding: 4px 8px;
	}

	th {
		background: var(--MI_THEME-panel);
		font-weight: 600;
	}

	.note-id {
		font-family: monospace;
		font-size: 85%;
	}
}
</style>