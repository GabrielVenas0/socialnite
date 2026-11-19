/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Social Nite: a troca de timeline ficava nas abas do topo da página de timeline.
// Movemos os controles para a navbar lateral, então a lógica vive aqui para ser
// compartilhada entre as navbars (vertical e horizontal).

import type { BasicTimelineType } from '@/timelines.js';
import { store } from '@/store.js';
import { deepMerge } from '@/utility/merge.js';
import { mainRouter } from '@/router.js';

export function switchBasicTimeline(src: BasicTimelineType): void {
	store.set('tl', deepMerge({ src }, store.s.tl));

	const path = window.location.pathname;
	if (path !== '/' && path !== '/timeline') {
		mainRouter.push('/timeline');
	}
}

// Social Nite: o botão do menu leva direto para a página (antes abria um popup que,
// para quem ainda não tinha nada, só mostrava "Criar novo").
export async function chooseList(_ev?: MouseEvent): Promise<void> {
	mainRouter.push('/my/lists');
}

// Social Nite: o botão do menu leva direto para a página (antes abria um popup que,
// para quem ainda não tinha nada, só mostrava "Criar novo").
export async function chooseAntenna(_ev?: MouseEvent): Promise<void> {
	mainRouter.push('/my/antennas');
}

// Social Nite: o botão do menu leva direto para a página (antes abria um popup que,
// para quem ainda não tinha nada, só mostrava "Criar novo").
export async function chooseChannel(_ev?: MouseEvent): Promise<void> {
	mainRouter.push('/channels');
}
