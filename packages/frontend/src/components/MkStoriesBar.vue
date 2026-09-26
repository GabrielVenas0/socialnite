<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="$i != null && (groups.length > 0 || !fetching)" :class="$style.root">
	<div :class="$style.scroller">
		<button :class="[$style.item, $style.addItem]" class="_button" @click="create">
			<div :class="$style.addRing">
				<MkAvatar :class="$style.avatar" :user="$i" :link="false" :preview="false"/>
				<div :class="$style.plus"><i class="ti ti-plus"></i></div>
			</div>
			<div :class="$style.name">Seu story</div>
		</button>

		<button
			v-for="group in groups"
			:key="group.user.id"
			class="_button"
			:class="$style.item"
			@click="open(group)"
		>
			<div :class="[$style.ring, group.hasUnviewed ? $style.unviewed : $style.viewed]">
				<MkAvatar :class="$style.avatar" :user="group.user" :link="false" :preview="false"/>
			</div>
			<div :class="$style.name">{{ group.user.name ?? group.user.username }}</div>
		</button>
	</div>
</div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import type { StoryGroup } from '@/utility/stories.js';
import { fetchStoryTimeline } from '@/utility/stories.js';
import { $i } from '@/i.js';
import * as os from '@/os.js';

const groups = ref<StoryGroup[]>([]);
const fetching = ref(true);

async function load() {
	fetching.value = true;
	try {
		groups.value = await fetchStoryTimeline();
	} finally {
		fetching.value = false;
	}
}

async function open(group: StoryGroup) {
	const { dispose } = await os.popupAsyncWithDialog(import('@/components/MkStoryViewer.vue').then(x => x.default), {
		group,
	}, {
		closed: () => {
			dispose();
			load();
		},
	});
}

async function create() {
	const { dispose } = await os.popupAsyncWithDialog(import('@/components/MkStoryCreateDialog.vue').then(x => x.default), {}, {
		posted: () => {
			load();
		},
		closed: () => dispose(),
	});
}

onMounted(load);

defineExpose({ reload: load });
</script>

<style lang="scss" module>
.root {
	margin-bottom: var(--MI-margin);
	overflow: hidden;
}

.scroller {
	display: flex;
	gap: 14px;
	overflow-x: auto;
	padding: 4px 2px 8px;
	scrollbar-width: none;

	&::-webkit-scrollbar {
		display: none;
	}
}

.item {
	flex: 0 0 auto;
	width: 72px;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 6px;
}

.ring,
.addRing {
	position: relative;
	width: 64px;
	height: 64px;
	border-radius: 50%;
	display: grid;
	place-items: center;
	padding: 3px;
	box-sizing: border-box;
}

.unviewed {
	background: linear-gradient(135deg, var(--MI_THEME-accent), var(--MI_THEME-accentLighten, var(--MI_THEME-accent)) 45%, var(--MI_THEME-love, var(--MI_THEME-accent)));
}

.viewed {
	background: var(--MI_THEME-divider);
}

.addRing {
	background: var(--MI_THEME-divider);
}

.avatar {
	width: 100%;
	height: 100%;
	border: 2px solid var(--MI_THEME-panel);
	box-sizing: border-box;
}

.plus {
	position: absolute;
	right: -2px;
	bottom: -2px;
	width: 22px;
	height: 22px;
	border-radius: 50%;
	background: var(--MI_THEME-accent);
	color: var(--MI_THEME-fgOnAccent);
	display: grid;
	place-items: center;
	font-size: 12px;
	border: 2px solid var(--MI_THEME-panel);
	box-sizing: border-box;
}

.name {
	width: 100%;
	font-size: 0.72em;
	text-align: center;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	opacity: 0.8;
}
</style>
