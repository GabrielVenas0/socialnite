/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

'use strict';

(() => {
	document.addEventListener('DOMContentLoaded', () => {
		const locale = JSON.parse(localStorage.getItem('locale') || '{}');

		const messages = Object.assign({
			title: 'Falha ao carregar o Social Nite',
			serverError: 'Se o problema continuar depois de esperar um pouco e recarregar, fale com a administração do Social Nite e informe o ID do erro abaixo.',
			solution: 'Estas ações podem resolver o problema:',
			solution1: 'Atualize o sistema e o navegador',
			solution2: 'Desative o bloqueador de anúncios',
			solution3: 'Limpe o cache do navegador',
			solution4: '(Navegador Tor) Ative a opção dom.webaudio.enabled',
			otherOption: 'Outras opções',
			otherOption1: 'Limpar preferências e cache',
			otherOption2: 'Abrir a versão simples',
			otherOption3: 'Abrir a ferramenta de reparo',
		}, locale?._bootErrors || {});
		const reload = locale?.reload || 'Recarregar';

		const reloadEls = document.querySelectorAll('[data-i18n-reload]');
		for (const el of reloadEls) {
			el.textContent = reload;
		}

		const i18nEls = document.querySelectorAll('[data-i18n]');
		for (const el of i18nEls) {
			const key = el.dataset.i18n;
			if (key && messages[key]) {
				el.textContent = messages[key];
			}
		}
	});
})();
