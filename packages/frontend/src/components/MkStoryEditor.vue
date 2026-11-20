<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModal ref="modal" :preferType="'dialog'" :zPriority="'middle'" @esc="onEsc" @closed="emit('closed')">
	<div :class="$style.root" role="dialog" aria-modal="true" aria-label="Editar foto do story">
		<div :class="$style.top">
			<button class="_button" :class="$style.roundButton" title="Fechar" aria-label="Fechar" @click="cancel"><i class="ti ti-x"></i></button>
			<div :class="$style.modes" role="group" aria-label="Modo de edição">
				<button
					v-for="item in MODES"
					:key="item.value"
					class="_button"
					:class="[$style.modeButton, { [$style.active]: mode === item.value }]"
					:aria-pressed="mode === item.value"
					:disabled="!ready"
					@click="setMode(item.value)"
				>
					<i :class="item.icon"></i>
					<span :class="$style.modeLabel">{{ item.label }}</span>
				</button>
			</div>
		</div>

		<div ref="stageEl" :class="$style.stageWrap">
			<div
				ref="gestureEl"
				:class="[$style.stage, { [$style.drawing]: mode === 'draw' }]"
				@pointerdown="onPointerDown"
				@pointermove="onPointerMove"
				@pointerup="onPointerEnd"
				@pointercancel="onPointerEnd"
				@click="onStageClick"
				@wheel.prevent="onWheel"
				@contextmenu.prevent
			>
				<canvas ref="canvasEl" :class="$style.canvas"></canvas>
			</div>
			<div v-if="!ready" :class="$style.loading"><MkLoading/></div>
			<div v-if="editingId != null" :class="$style.editBackdrop" @pointerdown="commitEditing"></div>
			<!-- Fica sempre montado (só invisível) para o foco abrir o teclado no iOS dentro do toque. -->
			<textarea
				ref="textareaEl"
				v-model="draft"
				:class="[$style.textarea, { [$style.textareaHidden]: editingId == null }]"
				:style="textareaStyle"
				:tabindex="editingId == null ? -1 : 0"
				:aria-hidden="editingId == null"
				:maxlength="MAX_TEXT_LENGTH"
				aria-label="Texto do story"
				placeholder="Digite algo"
				rows="1"
				autocomplete="off"
				@keydown="onTextareaKeydown"
			></textarea>
		</div>

		<div :class="$style.tools">
			<template v-if="mode === 'move'">
				<div :class="$style.toolRow">
					<button class="_button" :class="$style.chip" title="Diminuir zoom" aria-label="Diminuir zoom" :disabled="!ready" @click="zoomBy(1 / 1.25)"><i class="ti ti-zoom-out"></i></button>
					<input v-model.number="zoomModel" type="range" :class="$style.range" :min="minZoom" :max="MAX_ZOOM" step="0.01" aria-label="Zoom" :disabled="!ready"/>
					<button class="_button" :class="$style.chip" title="Aumentar zoom" aria-label="Aumentar zoom" :disabled="!ready" @click="zoomBy(1.25)"><i class="ti ti-zoom-in"></i></button>
				</div>
				<div :class="$style.toolRow">
					<span :class="$style.hint">Arraste para mover · pinça ou roda do mouse para o zoom</span>
					<button class="_button" :class="$style.chip" :disabled="!ready" @click="fotoInteira"><i class="ti ti-arrows-minimize"></i> Foto inteira</button>
					<button class="_button" :class="$style.chip" :disabled="!ready" @click="resetView(); requestRender()"><i class="ti ti-focus-centered"></i> Preencher</button>
				</div>
			</template>

			<template v-else-if="mode === 'draw'">
				<div :class="$style.toolRow" role="radiogroup" aria-label="Cor do pincel">
					<button
						v-for="color in COLORS"
						:key="color.value"
						class="_button"
						:class="[$style.swatch, { [$style.swatchActive]: brushColor === color.value }]"
						:style="{ background: color.value }"
						role="radio"
						:aria-checked="brushColor === color.value"
						:aria-label="color.label"
						:title="color.label"
						@click="brushColor = color.value"
					></button>
				</div>
				<div :class="$style.toolRow">
					<button
						v-for="size in BRUSH_SIZES"
						:key="size.value"
						class="_button"
						:class="[$style.chip, { [$style.chipActive]: brushSize === size.value }]"
						:aria-pressed="brushSize === size.value"
						:aria-label="`Pincel ${size.label}`"
						:title="`Pincel ${size.label}`"
						@click="brushSize = size.value"
					>
						<span :class="$style.dot" :style="{ width: `${size.dot}px`, height: `${size.dot}px`, background: brushColor }"></span>
					</button>
					<button class="_button" :class="$style.chip" :disabled="strokes.length === 0" @click="undo"><i class="ti ti-arrow-back-up"></i> Desfazer</button>
				</div>
			</template>

			<template v-else>
				<div :class="$style.toolRow" role="radiogroup" aria-label="Cor do texto">
					<button
						v-for="color in COLORS"
						:key="color.value"
						class="_button"
						:class="[$style.swatch, { [$style.swatchActive]: currentTextStyle.color === color.value }]"
						:style="{ background: color.value }"
						role="radio"
						:aria-checked="currentTextStyle.color === color.value"
						:aria-label="color.label"
						:title="color.label"
						@mousedown.prevent
						@click="setTextColor(color.value)"
					></button>
				</div>
				<div :class="$style.toolRow">
					<button
						class="_button"
						:class="[$style.chip, { [$style.chipActive]: currentTextStyle.bg }]"
						:aria-pressed="currentTextStyle.bg"
						title="Fundo atrás do texto"
						aria-label="Fundo atrás do texto"
						@mousedown.prevent
						@click="toggleTextBg"
					>
						<i class="ti ti-square-letter-t"></i>
					</button>
					<i class="ti ti-text-size" :class="$style.rangeIcon" aria-hidden="true"></i>
					<input
						type="range"
						:class="$style.range"
						:min="TEXT_MIN_SIZE"
						:max="TEXT_MAX_SIZE"
						step="0.005"
						:value="currentTextStyle.size"
						aria-label="Tamanho do texto"
						@input="onTextSizeInput"
					/>
					<button v-if="activeText != null" class="_button" :class="$style.chip" title="Excluir texto" aria-label="Excluir texto" @mousedown.prevent @click="deleteActiveText"><i class="ti ti-trash"></i></button>
					<button v-if="editingId != null" class="_button" :class="[$style.chip, $style.chipActive]" @mousedown.prevent @click="commitEditing"><i class="ti ti-check"></i> Pronto</button>
					<button v-else class="_button" :class="$style.chip" :disabled="!ready" @click="addText()"><i class="ti ti-plus"></i> Texto</button>
				</div>
			</template>
		</div>

		<div :class="$style.bottom">
			<button class="_button" :class="[$style.pill, $style.cancel]" @click="cancel">Cancelar</button>
			<button class="_button" :class="[$style.pill, $style.done]" :disabled="!ready || exporting" @click="finish">
				<MkLoading v-if="exporting" :em="true"/>
				<template v-else>Concluir <i class="ti ti-check"></i></template>
			</button>
		</div>
	</div>
</MkModal>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowRef, useTemplateRef } from 'vue';
import MkModal from '@/components/MkModal.vue';
import * as os from '@/os.js';

type Mode = 'move' | 'draw' | 'text';
type Rect = { x: number; y: number; w: number; h: number; };
type Point = { x: number; y: number; };

// Coordenadas relativas ao quadro (0–1), para escalar igual na prévia e na exportação.
type Stroke = {
	color: string;
	width: number; // fração da largura do quadro
	points: number[]; // x0, y0, x1, y1, ...
};

type TextItem = {
	id: string;
	text: string;
	x: number; // centro do bloco
	y: number;
	color: string;
	bg: boolean;
	size: number; // tamanho da fonte como fração da largura do quadro
};

type TextLayout = {
	lines: { text: string; width: number; }[];
	fontPx: number;
	lineHeight: number;
	padX: number;
	padY: number;
	width: number;
	height: number;
};

type Gesture =
	| { kind: 'pan'; id: number; last: Point; start: Point; moved: boolean; }
	| { kind: 'pinch'; lastMid: Point; lastDist: number; }
	| { kind: 'draw'; id: number; stroke: Stroke; }
	| { kind: 'text'; id: number; textId: string; start: Point; origX: number; origY: number; moved: boolean; };

const OUT_W = 1080;
const OUT_H = 1920;
const FRAME_ASPECT = OUT_W / OUT_H; // 9:16
// Largura de referência do layout de texto: quebrar as linhas sempre nesta escala garante a mesma quebra na prévia e na exportação.
const REF = OUT_W;
const MAX_SOURCE_SIDE = 2160;
const MAX_ZOOM = 5;
const TAP_SLOP = 6;
const STAGE_BG = '#0b0b0d';
const TEXT_MAX_WIDTH = REF * 0.84;
const TEXT_LINE_HEIGHT = 1.25;
const TEXT_MIN_SIZE = 0.04;
const TEXT_MAX_SIZE = 0.14;
const TEXT_DEFAULT_SIZE = 0.075;
const MAX_TEXT_LENGTH = 300;
const FONT_FAMILY = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

const MODES: { value: Mode; label: string; icon: string; }[] = [
	{ value: 'move', label: 'Mover', icon: 'ti ti-arrows-move' },
	{ value: 'draw', label: 'Desenhar', icon: 'ti ti-brush' },
	{ value: 'text', label: 'Texto', icon: 'ti ti-typography' },
];

const COLORS = [
	{ value: '#ffffff', label: 'Branco' },
	{ value: '#000000', label: 'Preto' },
	{ value: '#ff3b30', label: 'Vermelho' },
	{ value: '#ffd60a', label: 'Amarelo' },
	{ value: '#34c759', label: 'Verde' },
	{ value: '#0a84ff', label: 'Azul' },
	{ value: '#ff2d92', label: 'Rosa' },
	{ value: '#af52de', label: 'Roxo' },
];

const BRUSH_SIZES = [
	{ value: 0.01, label: 'fino', dot: 6 },
	{ value: 0.02, label: 'médio', dot: 10 },
	{ value: 0.04, label: 'grosso', dot: 16 },
];

const props = defineProps<{
	file: File;
}>();

const emit = defineEmits<{
	(ev: 'done', file: File): void;
	(ev: 'canceled'): void;
	(ev: 'failed'): void;
	(ev: 'closed'): void;
}>();

const modal = useTemplateRef('modal');
const stageEl = useTemplateRef('stageEl');
const gestureEl = useTemplateRef('gestureEl');
const canvasEl = useTemplateRef('canvasEl');
const textareaEl = useTemplateRef('textareaEl');

const ready = ref(false);
const exporting = ref(false);
const mode = ref<Mode>('move');
const zoom = ref(1);
const frame = ref<Rect>({ x: 0, y: 0, w: 0, h: 0 });

const brushColor = ref('#ffffff');
const brushSize = ref(BRUSH_SIZES[1].value);
const strokes = shallowRef<Stroke[]>([]);

const texts = ref<TextItem[]>([]);
const selectedId = ref<string | null>(null);
const editingId = ref<string | null>(null);
const draft = ref('');
const textDefaults = reactive({ color: '#ffffff', bg: false, size: TEXT_DEFAULT_SIZE });

// Centro da foto relativo ao quadro (0–1 em cada eixo). O zoom é multiplicador do "cover".
let cx = 0.5;
let cy = 0.5;
let source: HTMLCanvasElement | null = null;
let imgW = 1;
let imgH = 1;
// Fundo das sobras quando a foto inteira não cobre o quadro: a própria foto reduzida a
// poucos pixels e esticada fica desfocada (funciona em qualquer navegador, sem filter).
let fundo: HTMLCanvasElement | null = null;
// Zoom 1 = foto cobrindo o quadro. O mínimo deixa a foto inteira caber, como no Instagram.
const minZoom = ref(1);

let ctx: CanvasRenderingContext2D | null = null;
let dpr = 1;
let stageW = 0;
let stageH = 0;
let stageRect: DOMRect | null = null;
let rafId: number | null = null;
let resizeObserver: ResizeObserver | null = null;
let objectUrl: string | null = null;
let disposed = false;
let closing = false;
let textSeq = 0;

const pointers = new Map<number, Point>();
let gesture: Gesture | null = null;
let gestureBaseZoom = 1;

const activeText = computed(() => {
	const id = editingId.value ?? selectedId.value;
	if (id == null) return null;
	return texts.value.find(t => t.id === id) ?? null;
});

const currentTextStyle = computed(() => activeText.value ?? textDefaults);

const zoomModel = computed({
	get: () => zoom.value,
	set: (value: number) => {
		const f = frame.value;
		zoomAt(value, f.x + f.w / 2, f.y + f.h / 2);
		requestRender();
	},
});

const textareaStyle = computed(() => {
	const f = frame.value;
	const style = currentTextStyle.value;
	const k = f.w / REF;
	const layout = getLayout(draft.value === '' ? 'Digite algo' : draft.value, style.size);
	const realFontPx = layout.fontPx * k;
	// O iOS dá zoom na página ao focar campo com fonte < 16px: o campo usa 16px e encolhe com transform.
	const s = realFontPx > 0 && realFontPx < 16 ? realFontPx / 16 : 1;
	const u = k / s; // px CSS por unidade de referência, antes do transform
	const visualWidth = Math.min(layout.width, TEXT_MAX_WIDTH + layout.padX * 2) * k + 4 + realFontPx * 0.1;
	const width = visualWidth / s;
	const fill = style.bg ? contrastColor(style.color) : style.color;
	return {
		left: `${f.x + f.w / 2 - width / 2}px`,
		top: `${f.y + f.h * 0.2}px`,
		width: `${width}px`,
		height: `${layout.height * u}px`,
		padding: `${layout.padY * u}px ${layout.padX * u}px`,
		transform: s === 1 ? 'none' : `scale(${s})`,
		transformOrigin: 'top center',
		fontFamily: FONT_FAMILY,
		fontSize: `${layout.fontPx * u}px`,
		lineHeight: `${layout.lineHeight * u}px`,
		borderRadius: `${layout.fontPx * 0.28 * u}px`,
		color: fill,
		caretColor: fill,
		background: style.bg ? style.color : 'transparent',
		textShadow: !style.bg && luminance(style.color) > 0.45 ? `0 ${layout.fontPx * 0.03 * u}px ${layout.fontPx * 0.15 * u}px rgba(0, 0, 0, 0.4)` : 'none',
	};
});

//#region util
function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value));
}

function luminance(hex: string) {
	const n = parseInt(hex.slice(1), 16);
	return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}

function contrastColor(hex: string) {
	return luminance(hex) > 0.6 ? '#000000' : '#ffffff';
}

function fontFor(px: number) {
	return `700 ${px}px ${FONT_FAMILY}`;
}

function roundRectPath(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
	const rr = Math.max(0, Math.min(r, w / 2, h / 2));
	c.beginPath();
	c.moveTo(x + rr, y);
	c.arcTo(x + w, y, x + w, y + h, rr);
	c.arcTo(x + w, y + h, x, y + h, rr);
	c.arcTo(x, y + h, x, y, rr);
	c.arcTo(x, y, x + w, y, rr);
	c.closePath();
}
//#endregion

//#region text layout
let measureCtx: CanvasRenderingContext2D | null = null;
const layoutCache = new Map<string, TextLayout>();

function measurer(fontPx: number): (s: string) => number {
	measureCtx ??= window.document.createElement('canvas').getContext('2d');
	const m = measureCtx;
	if (m == null) return s => Array.from(s).length * fontPx * 0.6;
	m.font = fontFor(fontPx);
	return s => m.measureText(s).width;
}

// Quebra gulosa por espaço; palavra maior que a linha é cortada por caractere.
function wrapParagraph(paragraph: string, max: number, measure: (s: string) => number, out: string[]) {
	const tokens = paragraph.split(/(\s+)/).filter(t => t !== '');
	let line = '';
	for (const token of tokens) {
		const candidate = line + token;
		if (measure(candidate.trimEnd()) <= max) {
			line = candidate;
			continue;
		}
		if (/^\s+$/.test(token)) {
			out.push(line.trimEnd());
			line = '';
			continue;
		}
		if (line.trim() !== '') out.push(line.trimEnd());
		let chars = Array.from(token);
		while (chars.length > 1 && measure(chars.join('')) > max) {
			let lo = 1;
			let hi = chars.length - 1;
			while (lo < hi) {
				const mid = Math.ceil((lo + hi) / 2);
				if (measure(chars.slice(0, mid).join('')) <= max) lo = mid;
				else hi = mid - 1;
			}
			out.push(chars.slice(0, lo).join(''));
			chars = chars.slice(lo);
		}
		line = chars.join('');
	}
	out.push(line.trimEnd());
}

function layoutText(text: string, size: number): TextLayout {
	const fontPx = size * REF;
	const measure = measurer(fontPx);
	const raw: string[] = [];
	for (const paragraph of text.split('\n')) wrapParagraph(paragraph, TEXT_MAX_WIDTH, measure, raw);
	const lines = raw.map(l => ({ text: l, width: l === '' ? 0 : measure(l) }));
	const lineHeight = fontPx * TEXT_LINE_HEIGHT;
	const padX = fontPx * 0.32;
	const padY = fontPx * 0.14;
	const contentWidth = Math.max(fontPx * 0.5, ...lines.map(l => l.width));
	return {
		lines,
		fontPx,
		lineHeight,
		padX,
		padY,
		width: contentWidth + padX * 2,
		height: lines.length * lineHeight + padY * 2,
	};
}

function getLayout(text: string, size: number): TextLayout {
	const key = `${size}\u0000${text}`;
	let layout = layoutCache.get(key);
	if (layout == null) {
		if (layoutCache.size > 200) layoutCache.clear();
		layout = layoutText(text, size);
		layoutCache.set(key, layout);
	}
	return layout;
}
//#endregion

//#region drawing
function drawFundo(c: CanvasRenderingContext2D, f: Rect) {
	if (fundo == null) return;
	c.save();
	c.beginPath();
	c.rect(f.x, f.y, f.w, f.h);
	c.clip();
	c.imageSmoothingEnabled = true;
	c.imageSmoothingQuality = 'high';
	c.drawImage(fundo, f.x, f.y, f.w, f.h);
	c.fillStyle = 'rgba(0, 0, 0, 0.25)';
	c.fillRect(f.x, f.y, f.w, f.h);
	c.restore();
}

function criarFundo(img: HTMLCanvasElement) {
	const w = 18;
	const h = 32;
	const fc = window.document.createElement('canvas');
	fc.width = w;
	fc.height = h;
	const c = fc.getContext('2d');
	if (c == null) return null;
	const s = Math.max(w / img.width, h / img.height);
	c.imageSmoothingEnabled = true;
	c.imageSmoothingQuality = 'high';
	c.drawImage(img, (w - img.width * s) / 2, (h - img.height * s) / 2, img.width * s, img.height * s);
	return fc;
}

function drawPhoto(c: CanvasRenderingContext2D, f: Rect) {
	if (source == null) return;
	if (zoom.value < 1) drawFundo(c, f);
	const s = zoom.value * Math.max(f.w / imgW, f.h / imgH);
	const w = imgW * s;
	const h = imgH * s;
	c.imageSmoothingEnabled = true;
	c.imageSmoothingQuality = 'high';
	c.drawImage(source, f.x + cx * f.w - w / 2, f.y + cy * f.h - h / 2, w, h);
}

function drawStroke(c: CanvasRenderingContext2D, stroke: Stroke, f: Rect) {
	const p = stroke.points;
	if (p.length < 2) return;
	const px = (i: number) => f.x + p[i] * f.w;
	const py = (i: number) => f.y + p[i + 1] * f.h;
	const lw = stroke.width * f.w;
	c.fillStyle = stroke.color;
	c.strokeStyle = stroke.color;
	c.lineWidth = lw;
	c.lineCap = 'round';
	c.lineJoin = 'round';
	if (p.length === 2) {
		c.beginPath();
		c.arc(px(0), py(0), lw / 2, 0, Math.PI * 2);
		c.fill();
		return;
	}
	c.beginPath();
	c.moveTo(px(0), py(0));
	for (let i = 2; i < p.length - 2; i += 2) {
		c.quadraticCurveTo(px(i), py(i), (px(i) + px(i + 2)) / 2, (py(i) + py(i + 2)) / 2);
	}
	c.lineTo(px(p.length - 2), py(p.length - 2));
	c.stroke();
}

// deviceScale: quantos pixels reais por unidade do contexto (DPR na prévia, 1 na exportação).
// Sombra não segue a transformação do canvas, por isso precisa dele.
function drawTextItem(c: CanvasRenderingContext2D, item: TextItem, f: Rect, deviceScale: number, selected: boolean) {
	const layout = getLayout(item.text, item.size);
	const k = f.w / REF;
	const lh = layout.lineHeight;
	const top = -layout.height / 2;
	c.save();
	c.translate(f.x + item.x * f.w, f.y + item.y * f.h);
	c.scale(k, k);

	if (item.bg) {
		c.fillStyle = item.color;
		const radius = layout.fontPx * 0.28;
		layout.lines.forEach((line, i) => {
			if (line.width === 0) return;
			const w = line.width + layout.padX * 2;
			roundRectPath(c, -w / 2, top + i * lh, w, lh + layout.padY * 2, radius);
			c.fill();
		});
	}

	c.font = fontFor(layout.fontPx);
	c.textAlign = 'center';
	c.textBaseline = 'middle';
	c.fillStyle = item.bg ? contrastColor(item.color) : item.color;
	if (!item.bg && luminance(item.color) > 0.45) {
		c.shadowColor = 'rgba(0, 0, 0, 0.4)';
		c.shadowBlur = layout.fontPx * 0.15 * k * deviceScale;
		c.shadowOffsetY = layout.fontPx * 0.03 * k * deviceScale;
	}
	layout.lines.forEach((line, i) => {
		c.fillText(line.text, 0, top + layout.padY + i * lh + lh / 2);
	});

	if (selected) {
		c.shadowColor = 'transparent';
		c.strokeStyle = 'rgba(255, 255, 255, 0.85)';
		c.lineWidth = 1.5 / k;
		c.setLineDash([6 / k, 4 / k]);
		c.strokeRect(-layout.width / 2 - 4 / k, top - 4 / k, layout.width + 8 / k, layout.height + 8 / k);
	}
	c.restore();
}

function drawLayers(c: CanvasRenderingContext2D, f: Rect, deviceScale: number, preview: boolean) {
	c.save();
	c.beginPath();
	c.rect(f.x, f.y, f.w, f.h);
	c.clip();
	for (const stroke of strokes.value) drawStroke(c, stroke, f);
	if (gesture?.kind === 'draw') drawStroke(c, gesture.stroke, f);
	for (const item of texts.value) {
		if (item.text === '') continue;
		if (preview && item.id === editingId.value) continue;
		drawTextItem(c, item, f, deviceScale, preview && mode.value === 'text' && item.id === selectedId.value);
	}
	c.restore();
}

function render() {
	rafId = null;
	if (ctx == null || disposed) return;
	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	ctx.fillStyle = STAGE_BG;
	ctx.fillRect(0, 0, stageW, stageH);
	if (source == null) return;

	const f = frame.value;
	drawPhoto(ctx, f);

	// O que fica fora do quadro aparece escurecido (é o que vai ser cortado).
	ctx.beginPath();
	ctx.rect(0, 0, stageW, stageH);
	ctx.rect(f.x, f.y, f.w, f.h);
	ctx.fillStyle = 'rgba(0, 0, 0, 0.62)';
	ctx.fill('evenodd');

	drawLayers(ctx, f, dpr, true);

	ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
	ctx.lineWidth = 1;
	ctx.strokeRect(f.x - 0.5, f.y - 0.5, f.w + 1, f.h + 1);
}

function requestRender() {
	if (rafId != null || disposed) return;
	rafId = window.requestAnimationFrame(() => render());
}

function updateLayout() {
	const stage = stageEl.value;
	const canvas = canvasEl.value;
	if (stage == null || canvas == null) return;
	stageW = stage.clientWidth;
	stageH = stage.clientHeight;
	stageRect = stage.getBoundingClientRect();
	dpr = Math.min(window.devicePixelRatio || 1, 3);
	canvas.width = Math.max(1, Math.round(stageW * dpr));
	canvas.height = Math.max(1, Math.round(stageH * dpr));

	const margin = stageW < 500 ? 8 : 16;
	const availW = Math.max(1, stageW - margin * 2);
	const availH = Math.max(1, stageH - margin * 2);
	const h = Math.min(availH, availW / FRAME_ASPECT);
	const w = h * FRAME_ASPECT;
	frame.value = { x: (stageW - w) / 2, y: (stageH - h) / 2, w, h };

	// Redimensionar o canvas limpa o conteúdo: desenha já, sem esperar o próximo frame.
	if (rafId != null) {
		window.cancelAnimationFrame(rafId);
		rafId = null;
	}
	render();
}
//#endregion

//#region photo transform
// Tamanho da foto em relação ao quadro, já com o zoom.
function relativeSize() {
	const a = imgW / imgH;
	if (a > FRAME_ASPECT) return { w: zoom.value * a / FRAME_ASPECT, h: zoom.value };
	return { w: zoom.value, h: zoom.value * FRAME_ASPECT / a };
}

// Maior que o quadro: a foto não deixa buraco. Menor (foto inteira): não sai do quadro.
function clampView() {
	const rel = relativeSize();
	cx = clamp(cx, Math.min(1 - rel.w / 2, rel.w / 2), Math.max(1 - rel.w / 2, rel.w / 2));
	cy = clamp(cy, Math.min(1 - rel.h / 2, rel.h / 2), Math.max(1 - rel.h / 2, rel.h / 2));
}

// Mostra a foto inteira dentro do quadro (as sobras ficam com o fundo desfocado).
function fotoInteira() {
	zoom.value = minZoom.value;
	cx = 0.5;
	cy = 0.5;
	requestRender();
}

function resetView() {
	zoom.value = 1;
	cx = 0.5;
	cy = 0.5;
}

function panBy(dx: number, dy: number) {
	const f = frame.value;
	if (f.w === 0 || f.h === 0) return;
	cx += dx / f.w;
	cy += dy / f.h;
	clampView();
}

// Zoom ancorado num ponto do palco: o pixel da foto sob esse ponto fica parado.
function zoomAt(next: number, px: number, py: number) {
	const f = frame.value;
	const z0 = zoom.value;
	const z1 = clamp(next, minZoom.value, MAX_ZOOM);
	if (f.w === 0 || f.h === 0 || !Number.isFinite(z1)) return;
	if (z1 !== z0) {
		const ax = (px - f.x) / f.w;
		const ay = (py - f.y) / f.h;
		cx = ax + (cx - ax) * (z1 / z0);
		cy = ay + (cy - ay) * (z1 / z0);
		zoom.value = z1;
	}
	clampView();
}

function zoomBy(factor: number) {
	const f = frame.value;
	zoomAt(zoom.value * factor, f.x + f.w / 2, f.y + f.h / 2);
	requestRender();
}
//#endregion

//#region gestures
function toLocal(ev: { clientX: number; clientY: number; }): Point {
	const rect = stageRect ?? stageEl.value?.getBoundingClientRect();
	if (rect == null) return { x: ev.clientX, y: ev.clientY };
	return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
}

function toFrame(p: Point): Point {
	const f = frame.value;
	return { x: (p.x - f.x) / f.w, y: (p.y - f.y) / f.h };
}

function insideFrame(p: Point) {
	const f = frame.value;
	return p.x >= f.x && p.x <= f.x + f.w && p.y >= f.y && p.y <= f.y + f.h;
}

function hitTestText(p: Point): TextItem | null {
	const f = frame.value;
	const k = f.w / REF;
	for (let i = texts.value.length - 1; i >= 0; i--) {
		const item = texts.value[i];
		if (item.text === '') continue;
		const layout = getLayout(item.text, item.size);
		const centerX = f.x + item.x * f.w;
		const centerY = f.y + item.y * f.h;
		if (Math.abs(p.x - centerX) <= layout.width * k / 2 + 8 && Math.abs(p.y - centerY) <= layout.height * k / 2 + 8) return item;
	}
	return null;
}

function startPinch() {
	const list = Array.from(pointers.values());
	if (list.length < 2) return;
	const [a, b] = list;
	gesture = {
		kind: 'pinch',
		lastMid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
		lastDist: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
	};
}

function onPointerDown(ev: PointerEvent) {
	if (!ready.value || closing) return;
	if (ev.pointerType === 'mouse' && ev.button !== 0) return;
	if (editingId.value != null) {
		commitEditing();
		return;
	}

	stageRect = stageEl.value?.getBoundingClientRect() ?? null;
	const p = toLocal(ev);
	pointers.set(ev.pointerId, p);
	try {
		gestureEl.value?.setPointerCapture(ev.pointerId);
	} catch {
		// sem captura o gesto ainda funciona dentro do palco
	}

	if (mode.value === 'draw') {
		if (gesture != null) return; // outros dedos são ignorados enquanto desenha
		const n = toFrame(p);
		gesture = { kind: 'draw', id: ev.pointerId, stroke: { color: brushColor.value, width: brushSize.value, points: [n.x, n.y] } };
		requestRender();
		return;
	}

	if (pointers.size >= 2) {
		startPinch();
		return;
	}

	const hit = hitTestText(p);
	if (hit != null) {
		gesture = { kind: 'text', id: ev.pointerId, textId: hit.id, start: p, origX: hit.x, origY: hit.y, moved: false };
		return;
	}
	gesture = { kind: 'pan', id: ev.pointerId, last: p, start: p, moved: false };
}

function onPointerMove(ev: PointerEvent) {
	if (!pointers.has(ev.pointerId) || gesture == null) return;
	const p = toLocal(ev);
	pointers.set(ev.pointerId, p);

	switch (gesture.kind) {
		case 'draw': {
			if (ev.pointerId !== gesture.id) return;
			const pts = gesture.stroke.points;
			const f = frame.value;
			const events = typeof ev.getCoalescedEvents === 'function' ? ev.getCoalescedEvents() : [];
			for (const e2 of events.length > 0 ? events : [ev]) {
				const n = toFrame(toLocal(e2));
				const dx = (n.x - pts[pts.length - 2]) * f.w;
				const dy = (n.y - pts[pts.length - 1]) * f.h;
				if (dx * dx + dy * dy < 0.5) continue;
				pts.push(n.x, n.y);
			}
			break;
		}
		case 'pan': {
			if (ev.pointerId !== gesture.id) return;
			if (!gesture.moved && Math.hypot(p.x - gesture.start.x, p.y - gesture.start.y) > TAP_SLOP) gesture.moved = true;
			panBy(p.x - gesture.last.x, p.y - gesture.last.y);
			gesture.last = p;
			break;
		}
		case 'text': {
			if (ev.pointerId !== gesture.id) return;
			if (!gesture.moved && Math.hypot(p.x - gesture.start.x, p.y - gesture.start.y) > TAP_SLOP) gesture.moved = true;
			if (!gesture.moved) return;
			const textId = gesture.textId;
			const item = texts.value.find(t => t.id === textId);
			if (item == null) return;
			const f = frame.value;
			item.x = clamp(gesture.origX + (p.x - gesture.start.x) / f.w, 0, 1);
			item.y = clamp(gesture.origY + (p.y - gesture.start.y) / f.h, 0, 1);
			break;
		}
		case 'pinch': {
			const list = Array.from(pointers.values());
			if (list.length < 2) return;
			const [a, b] = list;
			const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
			const dist = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y));
			zoomAt(zoom.value * dist / gesture.lastDist, gesture.lastMid.x, gesture.lastMid.y);
			panBy(mid.x - gesture.lastMid.x, mid.y - gesture.lastMid.y);
			gesture.lastMid = mid;
			gesture.lastDist = dist;
			break;
		}
	}
	requestRender();
}

function onPointerEnd(ev: PointerEvent) {
	if (!pointers.has(ev.pointerId)) return;
	pointers.delete(ev.pointerId);
	const g = gesture;
	if (g == null) return;
	const canceled = ev.type === 'pointercancel';

	switch (g.kind) {
		case 'draw': {
			if (ev.pointerId !== g.id) return;
			gesture = null;
			strokes.value = [...strokes.value, g.stroke];
			break;
		}
		case 'pan': {
			if (ev.pointerId !== g.id) return;
			gesture = null;
			if (g.moved || canceled || mode.value !== 'text') break;
			// Toque no vazio no modo Texto: tira a seleção ou cria um texto ali.
			if (selectedId.value != null) {
				selectedId.value = null;
			} else if (insideFrame(g.start)) {
				const n = toFrame(g.start);
				addText(clamp(n.x, 0.1, 0.9), clamp(n.y, 0.08, 0.92));
			}
			break;
		}
		case 'text': {
			if (ev.pointerId !== g.id) return;
			gesture = null;
			if (canceled) break;
			if (g.moved) {
				if (mode.value === 'text') selectedId.value = g.textId;
			} else {
				startEditing(g.textId);
			}
			break;
		}
		case 'pinch': {
			// Sobrou dedo na tela: segue arrastando (ou pinçando) com o que ficou.
			if (pointers.size >= 2) {
				startPinch();
			} else {
				const rest = pointers.entries().next();
				gesture = rest.done ? null : { kind: 'pan', id: rest.value[0], last: rest.value[1], start: rest.value[1], moved: true };
			}
			break;
		}
	}
	requestRender();
}

// No iOS o teclado só abre com foco dado dentro de um "click" de verdade.
function onStageClick() {
	if (editingId.value != null && window.document.activeElement !== textareaEl.value) {
		textareaEl.value?.focus({ preventScroll: true });
	}
}

function onWheel(ev: WheelEvent) {
	if (!ready.value || closing || editingId.value != null) return;
	let dy = ev.deltaY;
	if (ev.deltaMode === 1) dy *= 16;
	else if (ev.deltaMode === 2) dy *= stageH;
	// ctrlKey: pinça no trackpad (Chrome/Firefox mandam como wheel)
	const speed = ev.ctrlKey ? 0.01 : 0.0015;
	const p = toLocal(ev);
	zoomAt(zoom.value * Math.exp(-dy * speed), p.x, p.y);
	requestRender();
}

// Safari no Mac manda a pinça do trackpad como GestureEvent (não padrão).
function onGestureStart(ev: Event) {
	ev.preventDefault();
	gestureBaseZoom = zoom.value;
}

function onGestureChange(ev: Event) {
	ev.preventDefault();
	// No iOS a pinça com os dedos já chega pelos pointer events.
	if (pointers.size > 0 || !ready.value || editingId.value != null) return;
	const g = ev as Event & { scale?: number; clientX?: number; clientY?: number; };
	if (typeof g.scale !== 'number') return;
	const f = frame.value;
	const p = typeof g.clientX === 'number' && typeof g.clientY === 'number'
		? toLocal({ clientX: g.clientX, clientY: g.clientY })
		: { x: f.x + f.w / 2, y: f.y + f.h / 2 };
	zoomAt(gestureBaseZoom * g.scale, p.x, p.y);
	requestRender();
}

function onGestureEnd(ev: Event) {
	ev.preventDefault();
}
//#endregion

//#region modes, draw and text
function setMode(next: Mode) {
	commitEditing();
	mode.value = next;
	if (next !== 'text') selectedId.value = null;
	if (next === 'text' && texts.value.length === 0) addText();
	requestRender();
}

function undo() {
	strokes.value = strokes.value.slice(0, -1);
	requestRender();
}

function addText(x = 0.5, y = 0.42) {
	commitEditing();
	const item: TextItem = {
		id: `t${++textSeq}`,
		text: '',
		x,
		y,
		color: textDefaults.color,
		bg: textDefaults.bg,
		size: textDefaults.size,
	};
	texts.value.push(item);
	startEditing(item.id);
}

function startEditing(id: string) {
	const item = texts.value.find(t => t.id === id);
	if (item == null) return;
	mode.value = 'text';
	selectedId.value = id;
	editingId.value = id;
	draft.value = item.text;
	// Foco síncrono (ainda dentro do toque) para o teclado do celular abrir.
	const el = textareaEl.value;
	if (el != null) {
		el.focus({ preventScroll: true });
		nextTick(() => {
			const end = el.value.length;
			el.setSelectionRange(end, end);
		});
	}
	requestRender();
}

function commitEditing() {
	const id = editingId.value;
	if (id == null) return;
	const value = draft.value.replace(/^\n+/, '').trimEnd();
	const index = texts.value.findIndex(t => t.id === id);
	if (index !== -1) {
		if (value.trim() === '') {
			texts.value.splice(index, 1);
			selectedId.value = null;
		} else {
			texts.value[index].text = value;
		}
	}
	editingId.value = null;
	draft.value = '';
	textareaEl.value?.blur();
	requestRender();
}

function deleteActiveText() {
	const id = editingId.value ?? selectedId.value;
	if (id == null) return;
	texts.value = texts.value.filter(t => t.id !== id);
	editingId.value = null;
	selectedId.value = null;
	draft.value = '';
	textareaEl.value?.blur();
	requestRender();
}

function setTextColor(color: string) {
	textDefaults.color = color;
	if (activeText.value != null) activeText.value.color = color;
	requestRender();
}

function toggleTextBg() {
	const next = !currentTextStyle.value.bg;
	textDefaults.bg = next;
	if (activeText.value != null) activeText.value.bg = next;
	requestRender();
}

function onTextSizeInput(ev: Event) {
	const value = clamp((ev.target as HTMLInputElement).valueAsNumber, TEXT_MIN_SIZE, TEXT_MAX_SIZE);
	if (!Number.isFinite(value)) return;
	textDefaults.size = value;
	if (activeText.value != null) activeText.value.size = value;
	requestRender();
}

function onTextareaKeydown(ev: KeyboardEvent) {
	if (ev.isComposing) return;
	if (ev.key === 'Escape' || (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey))) {
		ev.preventDefault();
		ev.stopPropagation();
		commitEditing();
	}
}

function onWindowKeydown(ev: KeyboardEvent) {
	if (closing || editingId.value != null) return;
	if (!(ev.ctrlKey || ev.metaKey) || ev.shiftKey || ev.altKey || ev.key.toLowerCase() !== 'z') return;
	const active = window.document.activeElement;
	if (active instanceof HTMLTextAreaElement || (active instanceof HTMLInputElement && active.type !== 'range')) return;
	if (strokes.value.length === 0) return;
	ev.preventDefault();
	undo();
}
//#endregion

//#region load / export / close
function revokeObjectUrl() {
	if (objectUrl != null) {
		URL.revokeObjectURL(objectUrl);
		objectUrl = null;
	}
}

function loadImageElement(file: File): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		revokeObjectUrl();
		objectUrl = URL.createObjectURL(file);
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error('image decode failed'));
		img.src = objectUrl;
	});
}

// Decodifica respeitando a orientação EXIF e reduz para no máximo MAX_SOURCE_SIDE no lado maior.
async function loadSource(file: File): Promise<HTMLCanvasElement> {
	let decoded: ImageBitmap | HTMLImageElement | null = null;
	let width = 0;
	let height = 0;

	if (typeof window.createImageBitmap === 'function') {
		try {
			const bitmap = await window.createImageBitmap(file, { imageOrientation: 'from-image' });
			decoded = bitmap;
			width = bitmap.width;
			height = bitmap.height;
		} catch {
			// navegador sem suporte à opção ou ao formato: tenta pelo <img>, que já aplica o EXIF
			decoded = null;
		}
	}

	if (decoded == null) {
		const img = await loadImageElement(file);
		decoded = img;
		width = img.naturalWidth;
		height = img.naturalHeight;
	}

	try {
		if (width === 0 || height === 0) throw new Error('empty image');
		const scale = Math.min(1, MAX_SOURCE_SIDE / Math.max(width, height));
		const canvas = window.document.createElement('canvas');
		canvas.width = Math.max(1, Math.round(width * scale));
		canvas.height = Math.max(1, Math.round(height * scale));
		const c = canvas.getContext('2d');
		if (c == null) throw new Error('no 2d context');
		c.imageSmoothingEnabled = true;
		c.imageSmoothingQuality = 'high';
		c.drawImage(decoded, 0, 0, canvas.width, canvas.height);
		return canvas;
	} finally {
		if (!(decoded instanceof HTMLImageElement)) decoded.close();
		revokeObjectUrl();
	}
}

async function exportImage(): Promise<File> {
	const canvas = window.document.createElement('canvas');
	canvas.width = OUT_W;
	canvas.height = OUT_H;
	try {
		const c = canvas.getContext('2d');
		if (c == null) throw new Error('no 2d context');
		const f: Rect = { x: 0, y: 0, w: OUT_W, h: OUT_H };
		c.fillStyle = '#000000';
		c.fillRect(0, 0, OUT_W, OUT_H);
		drawPhoto(c, f);
		drawLayers(c, f, 1, false);
		const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
		if (blob == null) throw new Error('toBlob failed');
		const now = Date.now();
		return new File([blob], `story-${now}.jpg`, { type: 'image/jpeg', lastModified: now });
	} finally {
		// libera a memória do canvas na hora (importante no iOS)
		canvas.width = 0;
		canvas.height = 0;
	}
}

async function finish() {
	if (!ready.value || exporting.value || closing) return;
	commitEditing();
	exporting.value = true;
	let result: File;
	try {
		result = await exportImage();
	} catch {
		exporting.value = false;
		os.alert({
			type: 'error',
			text: 'Não foi possível gerar a imagem. Tente de novo.',
		});
		return;
	}
	closing = true;
	emit('done', result);
	modal.value?.close();
}

function cancel() {
	if (closing) return;
	closing = true;
	emit('canceled');
	modal.value?.close();
}

function fail() {
	if (closing) return;
	closing = true;
	emit('failed');
	modal.value?.close();
}

function onEsc() {
	if (editingId.value != null) {
		commitEditing();
		return;
	}
	cancel();
}
//#endregion

onMounted(() => {
	ctx = canvasEl.value?.getContext('2d') ?? null;

	if (stageEl.value != null) {
		resizeObserver = new ResizeObserver(() => updateLayout());
		resizeObserver.observe(stageEl.value);
	}
	updateLayout();

	const gestureTarget = gestureEl.value;
	if (gestureTarget != null) {
		gestureTarget.addEventListener('gesturestart', onGestureStart);
		gestureTarget.addEventListener('gesturechange', onGestureChange);
		gestureTarget.addEventListener('gestureend', onGestureEnd);
	}
	window.addEventListener('keydown', onWindowKeydown);

	loadSource(props.file).then(canvas => {
		if (disposed) {
			canvas.width = 0;
			canvas.height = 0;
			return;
		}
		source = canvas;
		imgW = canvas.width;
		imgH = canvas.height;
		const a = imgW / imgH;
		minZoom.value = Math.min(FRAME_ASPECT / a, a / FRAME_ASPECT);
		fundo = criarFundo(canvas);
		resetView();
		ready.value = true;
		requestRender();
	}).catch(() => {
		if (!disposed) fail();
	});
});

onBeforeUnmount(() => {
	disposed = true;
	if (rafId != null) window.cancelAnimationFrame(rafId);
	rafId = null;
	resizeObserver?.disconnect();
	resizeObserver = null;
	const gestureTarget = gestureEl.value;
	if (gestureTarget != null) {
		gestureTarget.removeEventListener('gesturestart', onGestureStart);
		gestureTarget.removeEventListener('gesturechange', onGestureChange);
		gestureTarget.removeEventListener('gestureend', onGestureEnd);
	}
	window.removeEventListener('keydown', onWindowKeydown);
	revokeObjectUrl();
	pointers.clear();
	gesture = null;
	layoutCache.clear();
	if (source != null) {
		source.width = 0;
		source.height = 0;
		source = null;
	}
	if (fundo != null) {
		fundo.width = 0;
		fundo.height = 0;
		fundo = null;
	}
	const canvas = canvasEl.value;
	if (canvas != null) {
		canvas.width = 0;
		canvas.height = 0;
	}
	ctx = null;
});
</script>

<style lang="scss" module>
.root {
	position: fixed;
	inset: 0;
	display: flex;
	flex-direction: column;
	background: #0b0b0d;
	color: #fff;
	overscroll-behavior: contain;
	user-select: none;
	-webkit-user-select: none;
	-webkit-tap-highlight-color: transparent;
}

.top,
.tools,
.bottom {
	flex: 0 0 auto;
	width: 100%;
	max-width: 720px;
	margin: 0 auto;
	box-sizing: border-box;
}

.top {
	display: flex;
	align-items: center;
	gap: 8px;
	padding: calc(8px + env(safe-area-inset-top)) 12px 8px;
}

.roundButton {
	flex: 0 0 auto;
	width: 40px;
	height: 40px;
	display: grid;
	place-items: center;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.1);
	color: #fff;
	font-size: 1.2em;
}

.modes {
	margin-left: auto;
	display: flex;
	gap: 2px;
	padding: 3px;
	border-radius: 999px;
	background: rgba(255, 255, 255, 0.08);
}

.modeButton {
	display: flex;
	align-items: center;
	gap: 6px;
	height: 34px;
	padding: 0 12px;
	border-radius: 999px;
	color: rgba(255, 255, 255, 0.82);
	font-size: 0.9em;
	transition: background 0.15s, color 0.15s;

	&.active {
		background: var(--MI_THEME-accent);
		color: var(--MI_THEME-fgOnAccent);
	}

	&:disabled {
		opacity: 0.5;
	}

	@media (max-width: 400px) {
		padding: 0 9px;
		gap: 5px;
		font-size: 0.82em;
	}
}

@media (max-width: 340px) {
	.modeLabel {
		display: none;
	}
}

.stageWrap {
	position: relative;
	flex: 1 1 auto;
	min-height: 0;
	overflow: hidden;
}

.stage {
	position: absolute;
	inset: 0;
	touch-action: none;
	cursor: grab;
	-webkit-touch-callout: none;

	&:active {
		cursor: grabbing;
	}

	&.drawing,
	&.drawing:active {
		cursor: crosshair;
	}
}

.canvas {
	position: absolute;
	inset: 0;
	display: block;
	width: 100%;
	height: 100%;
}

.loading {
	position: absolute;
	inset: 0;
	display: grid;
	place-items: center;
	pointer-events: none;
}

.editBackdrop {
	position: absolute;
	inset: 0;
	background: rgba(0, 0, 0, 0.5);
	touch-action: none;
}

.textarea {
	position: absolute;
	box-sizing: border-box;
	margin: 0;
	border: none;
	outline: none;
	resize: none;
	overflow: hidden;
	text-align: center;
	font-weight: 700;
	white-space: pre-wrap;
	overflow-wrap: anywhere;
	user-select: text;
	-webkit-user-select: text;

	&::placeholder {
		color: currentColor;
		opacity: 0.55;
	}
}

.textareaHidden {
	opacity: 0;
	pointer-events: none;
}

.tools {
	height: 96px;
	padding: 6px 12px 0;
	display: flex;
	flex-direction: column;
	justify-content: center;
	gap: 8px;
}

.toolRow {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	min-height: 38px;
}

.swatch {
	flex: 0 0 auto;
	width: 28px;
	height: 28px;
	border-radius: 50%;
	border: 2px solid rgba(255, 255, 255, 0.9);
	box-sizing: border-box;
	transition: transform 0.12s;

	&.swatchActive {
		transform: scale(1.18);
		box-shadow: 0 0 0 2px #0b0b0d, 0 0 0 4px var(--MI_THEME-accent);
	}
}

.chip {
	flex: 0 0 auto;
	height: 36px;
	min-width: 36px;
	padding: 0 12px;
	box-sizing: border-box;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: 6px;
	border-radius: 999px;
	background: rgba(255, 255, 255, 0.1);
	color: #fff;
	font-size: 0.9em;
	white-space: nowrap;
	transition: background 0.15s;

	&.chipActive {
		background: var(--MI_THEME-accent);
		color: var(--MI_THEME-fgOnAccent);
	}

	&:disabled {
		opacity: 0.4;
	}
}

.dot {
	display: block;
	border-radius: 50%;
	box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.7);
}

.range {
	flex: 1 1 auto;
	min-width: 0;
	max-width: 320px;
	accent-color: var(--MI_THEME-accent);
}

.rangeIcon {
	flex: 0 0 auto;
	opacity: 0.8;
}

.hint {
	min-width: 0;
	font-size: 0.8em;
	opacity: 0.65;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.bottom {
	display: flex;
	justify-content: space-between;
	gap: 12px;
	padding: 8px 12px calc(10px + env(safe-area-inset-bottom));
}

.pill {
	height: 44px;
	padding: 0 24px;
	display: inline-flex;
	align-items: center;
	gap: 6px;
	border-radius: 999px;
	font-weight: bold;
}

.cancel {
	background: rgba(255, 255, 255, 0.12);
	color: #fff;
}

.done {
	background: var(--MI_THEME-accent);
	color: var(--MI_THEME-fgOnAccent);

	&:disabled {
		opacity: 0.6;
	}
}

.roundButton,
.modeButton,
.chip,
.swatch,
.pill {
	&:focus-visible {
		outline: 2px solid var(--MI_THEME-focus);
		outline-offset: 2px;
	}
}

@media (prefers-reduced-motion: reduce) {
	.modeButton,
	.swatch,
	.chip {
		transition: none;
	}
}
</style>
