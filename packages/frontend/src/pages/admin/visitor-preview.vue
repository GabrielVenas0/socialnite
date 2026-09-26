<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div class="_spacer" style="--MI_SPACER-w: 800px;">
	<div class="_gaps">
		<MkInfo>{{ i18n.ts.visitorPreviewDescription }}</MkInfo>

		<MkFoldableSection class="item">
			<template #header>{{ i18n.ts.statistics }}</template>
			<div v-if="stats" :class="$style.stats">
				<div :class="[$style.statsItem, $style.panel]">
					<div :class="$style.statsItemLabel">{{ i18n.ts.users }}</div>
					<div :class="$style.statsItemCount"><MkNumber :value="stats.originalUsersCount"/></div>
				</div>
				<div :class="[$style.statsItem, $style.panel]">
					<div :class="$style.statsItemLabel">{{ i18n.ts.notes }}</div>
					<div :class="$style.statsItemCount"><MkNumber :value="stats.originalNotesCount"/></div>
				</div>
			</div>
		</MkFoldableSection>

		<MkFoldableSection v-if="instance.policies.ltlAvailable" class="item">
			<template #header>{{ i18n.ts.letsLookAtTimeline }}</template>
			<div :class="[$style.tl, $style.panel]">
				<MkStreamingNotesTimeline src="local"/>
			</div>
		</MkFoldableSection>

		<MkFoldableSection class="item">
			<template #header>{{ i18n.ts._charts.activeUsers }}</template>
			<div :class="$style.panel">
				<XActiveUsersChart/>
			</div>
		</MkFoldableSection>

		<MkFoldableSection v-if="instances && instances.length > 0" class="item">
			<template #header>{{ i18n.ts.federation }}</template>
			<div :class="$style.federation">
				<MkMarqueeText :duration="40">
					<MkA v-for="fedInstance in instances" :key="fedInstance.id" :class="$style.federationInstance" :to="`/instance-info/${fedInstance.host}`" behavior="window">
						<img v-if="fedInstance.iconUrl" :class="$style.federationInstanceIcon" :src="getInstanceIcon(fedInstance)" alt=""/>
						<span class="_monospace">{{ fedInstance.host }}</span>
					</MkA>
				</MkMarqueeText>
			</div>
		</MkFoldableSection>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import * as Misskey from 'misskey-js';
import { i18n } from '@/i18n.js';
import { instance } from '@/instance.js';
import { definePage } from '@/page.js';
import { misskeyApi, misskeyApiGet } from '@/utility/misskey-api.js';
import { getProxiedImageUrl } from '@/utility/media-proxy.js';
import MkInfo from '@/components/MkInfo.vue';
import MkFoldableSection from '@/components/MkFoldableSection.vue';
import MkNumber from '@/components/MkNumber.vue';
import MkStreamingNotesTimeline from '@/components/MkStreamingNotesTimeline.vue';
import MkMarqueeText from '@/components/MkMarqueeText.vue';
import XActiveUsersChart from '@/components/MkVisitorDashboard.ActiveUsersChart.vue';

const stats = ref<Misskey.entities.StatsResponse | null>(null);
const instances = ref<Misskey.entities.FederationInstance[]>();

misskeyApi('stats', {}).then((res) => {
	stats.value = res;
});

misskeyApiGet('federation/instances', {
	sort: '+pubSub',
	limit: 20,
	blocked: false,
}).then(_instances => {
	instances.value = _instances;
});

function getInstanceIcon(fedInstance: Misskey.entities.FederationInstance): string {
	if (!fedInstance.iconUrl) {
		return '';
	}

	return getProxiedImageUrl(fedInstance.iconUrl, 'preview');
}

definePage(() => ({
	title: i18n.ts.visitorPreview,
	icon: 'ti ti-eye',
}));
</script>

<style lang="scss" module>
.panel {
	background: var(--MI_THEME-panel);
	border-radius: var(--MI-radius);
}

.stats {
	display: grid;
	grid-template-columns: 1fr 1fr;
	grid-gap: 16px;
}

.statsItem {
	overflow: clip;
	padding: 16px 20px;
}

.statsItemLabel {
	color: color(from var(--MI_THEME-fg) srgb r g b / 0.75);
	font-size: 0.9em;
}

.statsItemCount {
	font-weight: bold;
	font-size: 1.2em;
	color: var(--MI_THEME-accent);
}

.tl {
	overflow: clip;
}

.tlBody {
	height: 350px;
	overflow: auto;
}

.federation {
	background: var(--MI_THEME-panel);
	border-radius: 999px;
	overflow: clip;
	padding: 8px 0;
}

.federationInstance {
	display: inline-flex;
	align-items: center;
	vertical-align: bottom;
	padding: 6px 12px 6px 6px;
	margin: 0 10px 0 0;
	background: var(--MI_THEME-buttonBg);
	border-radius: 999px;
}

.federationInstanceIcon {
	display: inline-block;
	width: 20px;
	height: 20px;
	margin-right: 5px;
	border-radius: 999px;
}
</style>
