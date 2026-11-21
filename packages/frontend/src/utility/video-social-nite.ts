/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Social Nite: vídeo comprimido no próprio navegador (mediabunny), com a resolução limitada
// a 720p, e divisão de vídeos longos em partes de até 30 segundos para os Stories.

/** Duração máxima de cada story de vídeo, em segundos. */
export const STORY_PARTE_SEGUNDOS = 30;
/** No máximo 10 partes (5 minutos de vídeo) por envio. */
export const STORY_MAX_PARTES = 10;
/** Lado maior do vídeo depois de comprimido (720p). */
export const LADO_MAIOR_MAX = 1280;

/** Novo tamanho, mantendo a proporção, com o lado maior em até `ladoMax` (sempre par, como o H.264 pede). */
export function tamanhoReduzido(w: number, h: number, ladoMax = LADO_MAIOR_MAX): { width: number; height: number; reduziu: boolean } {
	const s = Math.min(1, ladoMax / Math.max(w, h));
	const par = (n: number) => Math.max(2, Math.round((n * s) / 2) * 2);
	return { width: par(w), height: par(h), reduziu: s < 1 };
}

/** Duração do vídeo em segundos (0 se não der para ler). */
export async function duracaoDoVideo(file: Blob): Promise<number> {
	const mediabunny = await import('mediabunny');
	const input = new mediabunny.Input({ source: new mediabunny.BlobSource(file), formats: mediabunny.ALL_FORMATS });
	try {
		return await input.computeDuration();
	} catch {
		return 0;
	}
}

export type ControleConversao = { cancelado: boolean; cancelar: (() => void) | null };

/**
 * Comprime (e, se pedir, recorta) o vídeo e devolve um MP4. Devolve `null` quando este
 * navegador não consegue converter o vídeo (aí quem chamou decide o que fazer).
 */
export async function converterVideo(file: Blob, opts: {
	inicio?: number;
	fim?: number;
	nivel?: 1 | 2 | 3;
	onProgress?: (p: number) => void;
	controle?: ControleConversao;
} = {}): Promise<Blob | null> {
	const mediabunny = await import('mediabunny');
	const input = new mediabunny.Input({ source: new mediabunny.BlobSource(file), formats: mediabunny.ALL_FORMATS });
	const output = new mediabunny.Output({ target: new mediabunny.BufferTarget(), format: new mediabunny.Mp4OutputFormat() });

	const nivel = opts.nivel ?? 2;
	const faixa = await input.getPrimaryVideoTrack().catch(() => null);
	const tamanho = faixa ? tamanhoReduzido(faixa.displayWidth, faixa.displayHeight) : null;

	const conversion = await mediabunny.Conversion.init({
		input,
		output,
		...(opts.inicio != null && opts.fim != null ? { trim: { start: opts.inicio, end: opts.fim } } : {}),
		video: {
			...(tamanho?.reduziu ? { width: tamanho.width, height: tamanho.height, fit: 'contain' as const } : {}),
			bitrate: nivel === 1 ? mediabunny.QUALITY_VERY_HIGH : nivel === 2 ? mediabunny.QUALITY_MEDIUM : mediabunny.QUALITY_VERY_LOW,
		},
		// mantém o áudio, copiando sem recodificar quando der (limitação do WebCodecs no iOS)
		audio: { discard: false },
		showWarnings: false,
	});

	if (!conversion.isValid) return null;

	if (opts.onProgress) conversion.onProgress = opts.onProgress;
	if (opts.controle) opts.controle.cancelar = () => { void conversion.cancel(); };

	await conversion.execute();
	if (opts.controle?.cancelado) return null;

	return new Blob([output.target.buffer!], { type: output.format.mimeType });
}
