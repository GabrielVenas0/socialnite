<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader>
	<div class="_spacer" style="--MI_SPACER-w: 700px;">
		<div class="_gaps">
			<MkFoldableSection>
				<template #header>Conquistas entre amigos</template>

				<MkLoading v-if="achievementsFetching"/>
				<div v-else-if="achievements.length === 0" :class="$style.empty">
					Siga outras pessoas para comparar conquistas com elas.
				</div>
				<div v-else class="_gaps_s">
					<MkA
						v-for="(row, i) in achievements"
						:key="row.user.id"
						:to="`/@${row.user.username}`"
						class="_panel"
						:class="$style.row"
					>
						<div :class="[$style.position, positionClass(i)]">{{ i + 1 }}</div>
						<MkAvatar :class="$style.avatar" :user="row.user" :link="false" :preview="false"/>
						<div :class="$style.name"><MkUserName :user="row.user"/></div>
						<div :class="$style.value">{{ row.count }}</div>
					</MkA>
				</div>
			</MkFoldableSection>

			<MkFoldableSection>
				<template #header>Vitórias no Reversi</template>

				<MkLoading v-if="reversiFetching"/>
				<div v-else-if="reversi.length === 0" :class="$style.empty">
					Ainda não há partidas concluídas. Jogue uma em Nite Games.
				</div>
				<div v-else class="_gaps_s">
					<MkA
						v-for="(row, i) in reversi"
						:key="row.user.id"
						:to="`/@${row.user.username}`"
						class="_panel"
						:class="$style.row"
					>
						<div :class="[$style.position, positionClass(i)]">{{ i + 1 }}</div>
						<MkAvatar :class="$style.avatar" :user="row.user" :link="false" :preview="false"/>
						<div :class="$style.name"><MkUserName :user="row.user"/></div>
						<div :class="$style.value">{{ row.wins }}</div>
					</MkA>
				</div>
			</MkFoldableSection>

			<MkFoldableSection>
				<template #header>Jogo das bolhas</template>
				<div :class="$style.empty">
					A pontuação do jogo das bolhas tem ranking próprio, dentro do jogo.
				</div>
				<MkButton link to="/bubble-game" style="margin-top: 12px;">Abrir o jogo</MkButton>
			</MkFoldableSection>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import MkButton from '@/components/MkButton.vue';
import type { AchievementRankingRow, ReversiRankingRow } from '@/utility/rankings.js';
import { fetchAchievementRanking, fetchReversiRanking } from '@/utility/rankings.js';
import { definePage } from '@/page.js';

const achievements = ref<AchievementRankingRow[]>([]);
const reversi = ref<ReversiRankingRow[]>([]);
const achievementsFetching = ref(true);
const reversiFetching = ref(true);

function positionClass(i: number) {
	return i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : null;
}

onMounted(async () => {
	fetchAchievementRanking()
		.then(rows => { achievements.value = rows; })
		.finally(() => { achievementsFetching.value = false; });

	fetchReversiRanking()
		.then(rows => { reversi.value = rows; })
		.finally(() => { reversiFetching.value = false; });
});

definePage(() => ({
	title: 'Ranking',
	icon: 'ti ti-trophy',
}));
</script>

<style lang="scss" module>
.row {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 10px 14px;
}

.position {
	flex: 0 0 auto;
	width: 26px;
	text-align: center;
	font-weight: 700;
	opacity: 0.6;
}

:global(.gold) {
	color: #d4af37;
	opacity: 1;
}

:global(.silver) {
	color: #b3b3b3;
	opacity: 1;
}

:global(.bronze) {
	color: #c2833d;
	opacity: 1;
}

.avatar {
	flex: 0 0 auto;
	width: 38px;
	height: 38px;
}

.name {
	flex: 1;
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.value {
	flex: 0 0 auto;
	font-weight: 700;
	font-size: 1.1em;
	color: var(--MI_THEME-accent);
}

.empty {
	opacity: 0.7;
	font-size: 0.9em;
	padding: 8px 2px;
}
</style>
