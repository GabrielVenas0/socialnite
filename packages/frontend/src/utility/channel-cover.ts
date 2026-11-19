/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * Social Nite: capa automática de canal sem banner — um degradê com a cor do canal
 * (ou o azul do Social Nite), para o cartão não ficar cinza e vazio.
 */
export function capaAutomatica(cor: string | null | undefined): string {
	const base = cor && /^#[0-9a-f]{6}$/i.test(cor) ? cor : '#0972c4';
	return `radial-gradient(circle at 18% 20%, rgba(255, 255, 255, 0.22), transparent 45%), linear-gradient(135deg, ${base}, color-mix(in srgb, ${base} 45%, #000))`;
}
