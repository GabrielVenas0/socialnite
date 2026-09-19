<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModal ref="modal" :preferType="'dialog'" @closed="emit('closed')" @esc="close">
	<div :class="$style.root">
		<div :class="$style.bars">
			<div v-for="(story, i) in group.stories" :key="story.id" :class="$style.bar">
				<div :class="$style.barFill" :style="{ width: i < index ? '100%' : i === index ? progress + '%' : '0%' }"></div>
			</div>
		</div>

		<div :class="$style.header">
			<MkAvatar :class="$style.headerAvatar" :user="group.user" :link="false" :preview="false"/>
			<div :class="$style.headerName">
				<MkUserName :user="group.user"/>
				<MkTime :time="current.createdAt" :class="$style.headerTime"/>
			</div>
			<button v-if="current.userId === $i?.id" class="_button" :class="$style.headerButton" @click.stop="remove">
				<i class="ti ti-trash"></i>
			</button>
			<button class="_button" :class="$style.headerButton" @click.stop="close">
				<i class="ti ti-x"></i>
			</button>
		</div>

		<div :class="$style.stage">
			<video
				v-if="isVideo"
				:key="current.id"
				:src="current.file?.url"
				:class="$style.media"
				playsinline
				@loadedmetadata="playVideo"
				@timeupdate="onVideoTime"
				@ended="next"
			></video>
			<img v-else-if="current.file != null" :key="current.id" :src="current.file.url" :alt="current.text ?? ''" :class="$style.media"/>
			<div v-else :key="current.id" :class="$style.textCard">{{ current.text }}</div>
			<div v-if="current.text && current.file != null" :class="$style.caption">{{ current.text }}</div>
		</div>

		<button :class="[$style.nav, $style.navPrev]" class="_button" @click.stop="prev"></button>
		<button :class="[$style.nav, $style.navNext]" class="_button" @click.stop="next"></button>
	</div>
</MkModal>
</template>

<script lang="ts" setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import MkModal from '@/components/MkModal.vue';
import type { StoryGroup } from '@/utility/stories.js';
import { markStoryViewed, deleteStory } from '@/utility/stories.js';
import { $i } from '@/i.js';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';

const DURATION_MS = 5000;
const TICK_MS = 50;

const props = defineProps<{
	group: StoryGroup;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const modal = ref<InstanceType<typeof MkModal> | null>(null);
const index = ref(Math.max(0, props.group.stories.findIndex(s => !s.isViewed)));
const progress = ref(0);
const current = computed(() => props.group.stories[index.value]);
const isVideo = computed(() => current.value.file?.type.startsWith('video/') ?? false);

let timer: number | null = null;

function stop() {
	if (timer != null) {
		window.clearInterval(timer);
		timer = null;
	}
}

function start() {
	stop();
	progress.value = 0;
	// vídeo controla o próprio progresso e o avanço (timeupdate/ended); só imagem usa o timer
	if (isVideo.value) return;
	timer = window.setInterval(() => {
		progress.value += (TICK_MS / DURATION_MS) * 100;
		if (progress.value >= 100) next();
	}, TICK_MS);
}

function playVideo(ev: Event) {
	const video = ev.target as HTMLVideoElement;
	video.play().catch(() => {
		// o navegador pode bloquear autoplay com som; tenta de novo sem som
		video.muted = true;
		video.play().catch(() => { /* sem autoplay, quem assiste avança tocando na tela */ });
	});
}

function onVideoTime(ev: Event) {
	const video = ev.target as HTMLVideoElement;
	if (video.duration > 0) progress.value = (video.currentTime / video.duration) * 100;
}

function next() {
	if (index.value >= props.group.stories.length - 1) {
		close();
		return;
	}
	index.value++;
}

function prev() {
	if (index.value === 0) return;
	index.value--;
}

function close() {
	stop();
	modal.value?.close();
}

async function remove() {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.ts.deleteConfirm,
	});
	if (canceled) return;

	await os.promiseDialog(deleteStory(current.value.id));
	close();
}

watch(index, () => {
	start();
	markStoryViewed(current.value.id).catch(() => { /* visualização é best-effort */ });
}, { immediate: false });

onMounted(() => {
	start();
	markStoryViewed(current.value.id).catch(() => { /* visualização é best-effort */ });
});

onBeforeUnmount(stop);
</script>

<style lang="scss" module>
.root {
	position: relative;
	width: min(420px, 100vw);
	height: min(760px, 100dvh);
	background: #000;
	border-radius: var(--MI-radius);
	overflow: hidden;
	display: flex;
	flex-direction: column;
}

.bars {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	z-index: 3;
	display: flex;
	gap: 4px;
	padding: 10px 10px 0;
}

.bar {
	flex: 1;
	height: 3px;
	border-radius: 3px;
	background: rgba(255, 255, 255, 0.3);
	overflow: hidden;
}

.barFill {
	height: 100%;
	background: #fff;
}

.header {
	position: absolute;
	top: 18px;
	left: 0;
	right: 0;
	z-index: 3;
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 8px 12px;
	color: #fff;
	text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
}

.headerAvatar {
	width: 34px;
	height: 34px;
	flex: 0 0 auto;
}

.headerName {
	flex: 1;
	min-width: 0;
	font-size: 0.9em;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.headerTime {
	margin-left: 8px;
	opacity: 0.75;
	font-size: 0.85em;
}

.headerButton {
	flex: 0 0 auto;
	color: #fff;
	font-size: 1.1em;
	padding: 4px;
}

.stage {
	flex: 1;
	min-height: 0;
	display: grid;
	place-items: center;
	position: relative;
}

.media {
	width: 100%;
	height: 100%;
	object-fit: contain;
}

.textCard {
	width: 100%;
	height: 100%;
	box-sizing: border-box;
	display: grid;
	place-items: center;
	padding: 90px 28px 60px;
	background: linear-gradient(160deg, var(--MI_THEME-accent), var(--MI_THEME-accentDarken, var(--MI_THEME-accent)));
	color: var(--MI_THEME-fgOnAccent, #fff);
	font-size: 1.5em;
	font-weight: bold;
	line-height: 1.35;
	text-align: center;
	white-space: pre-wrap;
	word-break: break-word;
	overflow-y: auto;
}

.caption {
	position: absolute;
	left: 0;
	right: 0;
	bottom: 0;
	padding: 24px 16px 20px;
	color: #fff;
	font-size: 0.95em;
	background: linear-gradient(transparent, rgba(0, 0, 0, 0.75));
	white-space: pre-wrap;
	word-break: break-word;
}

.nav {
	position: absolute;
	top: 64px;
	bottom: 0;
	width: 33%;
	z-index: 2;
}

.navPrev {
	left: 0;
}

.navNext {
	right: 0;
	width: 67%;
}
</style>
