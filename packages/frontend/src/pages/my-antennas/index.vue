<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 700px;">
		<div class="_gaps">
			<MkTip k="antennas">
				{{ i18n.ts.antennasAboutTip }}
			</MkTip>

			<!-- Social Nite: a lista vem primeiro; tocar abre o feed, a engrenagem abre a edição -->
			<div v-if="antennas.length > 0" class="_gaps_s">
				<div v-for="antenna in antennas" :key="antenna.id" :class="$style.antenna">
					<MkA :class="$style.antennaMain" :to="`/timeline/antenna/${antenna.id}`">
						<i class="ti ti-antenna"></i> {{ antenna.name }}
						<span v-if="antenna.hasUnreadNote" :class="$style.novo">novas notas</span>
					</MkA>
					<MkA v-tooltip="'Editar assunto'" :class="$style.antennaEdit" :to="`/my/antennas/${antenna.id}`" aria-label="Editar assunto"><i class="ti ti-settings"></i></MkA>
				</div>
			</div>
			<MkResult v-else type="empty" :text="'Você ainda não segue nenhum assunto. Escolha palavras e toda nota nova que tiver alguma delas aparece aqui.'"/>

			<MkButton :link="true" to="/my/antennas/create" primary rounded :class="$style.add"><i class="ti ti-plus"></i> {{ i18n.ts.createAntenna }}</MkButton>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { onActivated, computed } from 'vue';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';
import { antennasCache } from '@/cache.js';
import { useRouter } from '@/router.js';

const router = useRouter();

const antennas = computed(() => antennasCache.value.value ?? []);

function _fetch_() {
	antennasCache.fetch();
}

_fetch_();

const headerActions = computed(() => [{
	icon: 'ti ti-plus',
	text: i18n.ts.createAntenna,
	handler: () => { router.push('/my/antennas/create'); },
}, {
	icon: 'ti ti-refresh',
	text: i18n.ts.reload,
	handler: () => {
		antennasCache.delete();
		_fetch_();
	},
}]);

const headerTabs = computed(() => []);

definePage(() => ({
	title: i18n.ts.antennas,
	icon: 'ti ti-antenna',
}));

onActivated(() => {
	antennasCache.fetch();
});
</script>

<style lang="scss" module>
.add {
	margin: 0 auto;
}

.antenna {
	display: flex;
	align-items: center;
	border: solid 1px var(--MI_THEME-divider);
	border-radius: 6px;

	&:hover {
		border: solid 1px var(--MI_THEME-accent);
		text-decoration: none;
	}
}

.name {
	font-weight: bold;
}
.antennaMain {
	flex: 1;
	min-width: 0;
	padding: 16px;

	&:hover {
		text-decoration: none;
	}
}

.antennaEdit {
	flex-shrink: 0;
	padding: 16px;
	opacity: 0.7;

	&:hover {
		opacity: 1;
	}
}

.novo {
	margin-left: 8px;
	font-size: 0.8em;
	color: var(--MI_THEME-accent);
}
</style>
