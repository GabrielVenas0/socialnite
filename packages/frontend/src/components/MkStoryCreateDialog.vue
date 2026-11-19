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

			<div v-if="file != null || uploading != null" :class="$style.preview">
				<video v-if="file != null && isVideo" :src="file.url" :class="$style.previewMedia" muted playsinline preload="metadata"></video>
				<img v-else :src="previewSrc" :class="$style.previewMedia"/>
				<div v-if="uploading != null" :class="$style.previewProgress">
					<MkLoading :em="true"/>
					<span>Enviando… {{ Math.round(uploading.progress * 100) }}%</span>
				</div>
				<button class="_button" :class="$style.previewRemove" @click="removeFile"><i class="ti ti-x"></i></button>
			</div>
			<MkButton v-else rounded @click="pickFile"><i class="ti ti-photo-plus"></i> Adicionar foto ou vídeo</MkButton>

			<MkSwitch v-if="file != null || uploading != null" v-model="keepFile">
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
import isAnimated from 'is-file-animated';
import type * as Misskey from 'misskey-js';
import MkModalWindow from '@/components/MkModalWindow.vue';
import MkTextarea from '@/components/MkTextarea.vue';
import MkButton from '@/components/MkButton.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import MkInfo from '@/components/MkInfo.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { uploadFile } from '@/utility/drive.js';
import { prefer } from '@/preferences.js';
import { createStory } from '@/utility/stories.js';

const MAX_TEXT = 500;

// GIF/SVG (e imagens animadas, checadas na hora) não passam pelo editor: ele achataria a animação.
const NON_EDITABLE_IMAGE_TYPES = ['image/gif', 'image/svg+xml'];

type EditorResult = { kind: 'done'; file: File; } | { kind: 'canceled'; } | { kind: 'failed'; };

const emit = defineEmits<{
	(ev: 'posted'): void;
	(ev: 'closed'): void;
}>();

const dialog = useTemplateRef('dialog');

const text = ref('');
const file = ref<Misskey.entities.DriveFile | null>(null);
const keepFile = ref(false);
const posting = ref(false);
// Prévia local da foto editada: mostra na hora, sem esperar a miniatura do servidor.
const localPreviewUrl = ref<string | null>(null);
const uploading = ref<{ seq: number; progress: number; } | null>(null);
let abortUpload: (() => void) | null = null;
let uploadSeq = 0;
let posted = false;

const isVideo = computed(() => file.value?.type.startsWith('video/') ?? false);
const previewSrc = computed(() => localPreviewUrl.value ?? file.value?.thumbnailUrl ?? file.value?.url ?? undefined);
const canPost = computed(() => uploading.value == null && (file.value != null || text.value.trim().length > 0) && text.value.length <= MAX_TEXT);

// Se o usuário desistir, a mídia enviada só para este story não fica sobrando no Drive.
function discard(target: Misskey.entities.DriveFile) {
	misskeyApi('drive/files/delete', { fileId: target.id }).catch(() => { /* melhor esforço */ });
}

function clearLocalPreview() {
	if (localPreviewUrl.value != null) URL.revokeObjectURL(localPreviewUrl.value);
	localPreviewUrl.value = null;
}

function accept(picked: Misskey.entities.DriveFile | undefined) {
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
}

async function isEditableImage(source: File): Promise<boolean> {
	if (!source.type.startsWith('image/') || NON_EDITABLE_IMAGE_TYPES.includes(source.type)) return false;
	try {
		return !(await isAnimated(source));
	} catch {
		return true;
	}
}

// Abre o editor por cima de tudo e espera ele fechar.
async function openEditor(source: File): Promise<EditorResult> {
	let result = { kind: 'canceled' } as EditorResult;
	let resolveClosed: () => void = () => {};
	const editorClosed = new Promise<void>(resolve => { resolveClosed = resolve; });
	try {
		const { dispose } = await os.popupAsyncWithDialog(import('@/components/MkStoryEditor.vue').then(x => x.default), {
			file: source,
		}, {
			done: (edited: File) => { result = { kind: 'done', file: edited }; },
			failed: () => { result = { kind: 'failed' }; },
			closed: () => {
				dispose();
				resolveClosed();
			},
		});
	} catch {
		return { kind: 'failed' };
	}
	await editorClosed;
	return result;
}

// Mesmo caminho de envio do Drive (utility/drive.ts), com a prévia já na tela.
function uploadEdited(edited: File) {
	const seq = ++uploadSeq;
	clearLocalPreview();
	localPreviewUrl.value = URL.createObjectURL(edited);
	uploading.value = { seq, progress: 0 };

	const { filePromise, abort } = uploadFile(edited, {
		name: edited.name,
		folderId: prefer.s.uploadFolder,
		onProgress: ({ total, loaded }) => {
			if (uploading.value?.seq === seq && total > 0) uploading.value.progress = loaded / total;
		},
	});
	abortUpload = abort;

	filePromise.then(driveFile => {
		if (uploading.value?.seq !== seq) {
			// removido (ou diálogo fechado) enquanto enviava
			discard(driveFile);
			return;
		}
		accept(driveFile);
	}).catch(() => {
		// o uploadFile já avisou o erro (ou o envio foi cancelado)
		if (uploading.value?.seq === seq) clearLocalPreview();
	}).finally(() => {
		if (uploading.value?.seq === seq) {
			uploading.value = null;
			abortUpload = null;
		}
	});
}

async function pickFile() {
	const picked = (await os.chooseFileFromPc({ multiple: false })).at(0);
	if (picked == null) return;

	if (await isEditableImage(picked)) {
		const result = await openEditor(picked);
		if (result.kind === 'done') {
			uploadEdited(result.file);
			return;
		}
		if (result.kind === 'canceled') return; // volta para o diálogo sem arquivo
		os.toast('Não deu para abrir o editor. A foto vai do jeito que está.');
	}

	// Vídeo (e imagem que o editor não trata) segue o fluxo de sempre, pelo uploader.
	os.launchUploader([picked], {}).then(driveFiles => {
		accept(driveFiles[0]);
	}).catch(() => { /* uploader fechado sem enviar */ });
}

function removeFile() {
	if (uploading.value != null) {
		abortUpload?.();
		abortUpload = null;
		uploading.value = null;
	}
	if (file.value != null) discard(file.value);
	file.value = null;
	keepFile.value = false;
	clearLocalPreview();
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
	if (uploading.value != null) {
		abortUpload?.();
		abortUpload = null;
		uploading.value = null;
	}
	if (!posted && file.value != null) discard(file.value);
	clearLocalPreview();
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

.previewProgress {
	position: absolute;
	inset: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	background: rgba(0, 0, 0, 0.45);
	color: #fff;
	font-size: 0.9em;
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
