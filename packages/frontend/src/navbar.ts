/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { computed, reactive } from 'vue';
import { clearCache } from './utility/clear-cache.js';
import { $i } from '@/i.js';
import { i18n } from '@/i18n.js';

export const navbarItemDef = reactive({
	notifications: {
		title: i18n.ts.notifications,
		icon: 'ti ti-bell',
		show: computed(() => $i != null),
		indicated: computed(() => $i != null && $i.hasUnreadNotification),
		indicateValue: computed(() => {
			if (!$i || $i.unreadNotificationsCount === 0) return '';

			if ($i.unreadNotificationsCount > 99) {
				return '99+';
			} else {
				return $i.unreadNotificationsCount.toString();
			}
		}),
		to: '/my/notifications',
	},
	drive: {
		title: i18n.ts.drive,
		icon: 'ti ti-cloud',
		show: computed(() => $i != null),
		to: '/my/drive',
	},
	// Social Nite: "followRequests" saiu da navbar e virou uma aba dentro de
	// Notificações (e do widget de notificações), onde o pedido já chegava.
	explore: {
		title: i18n.ts.explore,
		icon: 'ti ti-world',
		to: '/explore',
	},
	announcements: {
		title: i18n.ts.announcements,
		icon: 'ti ti-speakerphone',
		// Social Nite: atalho visível só para a administração — quem publica os avisos.
		// Avisos com display "dialog" ou "banner" continuam aparecendo para todos.
		show: computed(() => $i != null && ($i.isAdmin || $i.isModerator)),
		indicated: computed(() => $i != null && $i.hasUnreadAnnouncement),
		to: '/announcements',
	},
	// Social Nite: removidos de 'Mais' — 'lookup' (depende de federação),
	// 'lists'/'antennas' (já são atalhos fixos no topo da navbar),
	// 'favorites' (sobrepõe Notas Salvas) e 'tools' (console de API, uso interno).
	qr: {
		title: i18n.ts.qr,
		icon: 'ti ti-qrcode',
		show: computed(() => $i != null),
		to: '/qr',
	},
	pages: {
		title: i18n.ts.pages,
		icon: 'ti ti-news',
		to: '/pages',
	},
	play: {
		title: 'Dê o Play',
		icon: 'ti ti-player-play',
		to: '/play',
	},
	gallery: {
		title: i18n.ts.gallery,
		icon: 'ti ti-icons',
		to: '/gallery',
	},
	clips: {
		title: i18n.ts.clip,
		icon: 'ti ti-paperclip',
		show: computed(() => $i != null),
		to: '/my/clips',
	},
	// Social Nite: "channels" saiu daqui — Canais já tem um atalho fixo no topo da
	// navbar, junto das timelines, e apareciam duas vezes.
	chat: {
		title: i18n.ts.directMessage_short,
		icon: 'ti ti-messages',
		to: '/chat',
		show: computed(() => $i != null && $i.policies.chatAvailability !== 'unavailable'),
		indicated: computed(() => $i != null && $i.hasUnreadChatMessages),
	},
	achievements: {
		title: i18n.ts.achievements,
		icon: 'ti ti-medal',
		show: computed(() => $i != null),
		to: '/my/achievements',
	},
	games: {
		title: 'Nite Games',
		icon: 'ti ti-device-gamepad',
		to: '/games',
	},
	// Social Nite: "ui" (Alternar UI) removido — o modo Deck é outra interface,
	// que não passou pelo mesmo ajuste visual.
	about: {
		// Social Nite: "Sobre" abre a página de documentação (visão geral, regras e
		// termos) em vez do menu suspenso do Misskey.
		title: i18n.ts.about,
		icon: 'ti ti-info-circle',
		to: '/about',
	},
	reload: {
		title: i18n.ts.reload,
		icon: 'ti ti-refresh',
		action: (ev) => {
			window.location.reload();
		},
	},
	profile: {
		title: i18n.ts.profile,
		icon: 'ti ti-user',
		show: computed(() => $i != null),
		to: `/@${$i?.username}`,
	},
	cacheClear: {
		title: i18n.ts.clearCache,
		icon: 'ti ti-trash',
		action: (ev) => {
			clearCache();
		},
	},
});
