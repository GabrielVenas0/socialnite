<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:width="420"
	@close="dialog?.close()"
	@closed="onClosed"
>
	<template #header>Novo story</template>

	<div class="_spacer" style="--MI_SPACER-w: 420px;">
		<div class="_gaps">
			<MkTextarea v-model="text" :autofocus="true" placeholder="O que está acontecendo?">
				<template #caption>{{ text.length }}/{{ MAX_TEXT }}</template>
			</MkTextarea>

			<div v-if="file != null" :class="$style.preview">
				<video v-if="isVideo" :src="file.url" :class="$style.previewMedia" muted playsinline preload="metadata"></video>
				<img v-else :src="file.thumbnailUrl ?? file.url" :class="$style.previewMedia"/>
				<button class="_button" :class="$style.previewRemove" @click="removeFile"><i class="ti ti-x"></i></button>
			</div>
			<MkButton v-else rounded @click="pickFile"><i class="ti ti-photo-plus"></i> Adicionar foto ou vídeo</MkButton>

			<MkSwitch v-if="file != null" v-model="keepFile">
				<template #label>Salvar no meu Drive</template>
				<template #caption>Desligado, a foto ou o vídeo é apagado junto com o story.</template>
			</MkSwitch>

			<MkInfo>O story some sozinho 24 horas depois de publicado.</MkInfo>

			<MkButton primary rounded :disabled="!canPost || posting" @click="post"><i class="ti ti-send"></i> Publicar</MkButton>
		</div>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { computed, ref, useTemplateRef } from 'vue';
import type * as Misskey from 'misskey-js';
import MkModalWindow from '@/components/MkModalWindow.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkButton from '@/components/MkButton.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkInfo from '@/components/MkInfo.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { chooseFileFromPcAndUpload } from '@/utility/drive.js';
import { createStory } from '@/utility/stories.js';

const MAX_TEXT = 500;

const emit = defineEmits<{
	(ev: 'posted'): void;
	(ev: 'closed'): void;
}>();

const dialog = useTemplateRef('dialog');

const text = ref('');
const file = ref<Misskey.entities.DriveFile | null>(null);
const keepFile = ref(false);
const posting = ref(false);
let posted = false;

const isVideo = computed(() => file.value?.type.startsWith('video/') ?? false);
const canPost = computed(() => (file.value != null || text.value.trim().length > 0) && text.value.length <= MAX_TEXT);

// Se o usuário desistir, a mídia enviada só para este story não fica sobrando no Drive.
function discard(target: Misskey.entities.DriveFile) {
	misskeyApi('drive/files/delete', { fileId: target.id }).catch(() => { /* melhor esforço */ });
}

function pickFile() {
	chooseFileFromPcAndUpload({ multiple: false }).then(files => {
		const picked = files[0];
		if (picked == null) return;

		if (!picked.type.startsWith('image/') && !picked.type.startsWith('video/')) {
			discard(picked);
			os.alert({
				type: 'error',
				text: 'O story aceita apenas foto ou vídeo.',
			});
			return;
		}

		file.value = picked;
	});
}

function removeFile() {
	if (file.value != null) discard(file.value);
	file.value = null;
	keepFile.value = false;
}

async function post() {
	posting.value = true;
	try {
		await os.promiseDialog(createStory({
			fileId: file.value?.id ?? null,
			text: text.value.trim() || null,
			keepFile: keepFile.value,
		}));
	} catch {
		// o promiseDialog já mostrou o erro
		posting.value = false;
		return;
	}

	posted = true;
	emit('posted');
	dialog.value?.close();
}

function onClosed() {
	if (!posted && file.value != null) discard(file.value);
	emit('closed');
}
</script>

<style lang="scss" module>
.preview {
	position: relative;
	display: grid;
	place-items: center;
	height: 260px;
	border-radius: var(--MI-radius);
	background: #000;
	overflow: hidden;
}

.previewMedia {
	width: 100%;
	height: 100%;
	object-fit: contain;
}

.previewRemove {
	position: absolute;
	top: 8px;
	right: 8px;
	width: 30px;
	height: 30px;
	display: grid;
	place-items: center;
	border-radius: 50%;
	background: rgba(0, 0, 0, 0.6);
	color: #fff;
}
</style>
