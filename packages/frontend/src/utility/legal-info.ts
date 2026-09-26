/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Dados usados pelos Termos de Uso e pela Política de Privacidade.
// Mudou de responsável, contato ou idade mínima? É só aqui.
export const LEGAL = {
	/** Quem responde pelo serviço, como aparece publicamente nos documentos. */
	operator: 'Nite',

	/** Contato para dúvidas, denúncias e pedidos sobre dados pessoais (LGPD). */
	contactEmail: 'contato@nite.tec.br',

	/** Desde quando esta versão dos documentos vale. */
	effectiveDate: '19 de setembro de 2026',

	/** Idade mínima para criar conta. */
	minAge: 13,

	/** Prazo para contestar uma decisão de moderação. */
	appealDays: 15,

	/** Antecedência mínima para avisar sobre encerramento do serviço. */
	shutdownNoticeDays: 30,

	/** Antecedência mínima para avisar sobre mudanças nos Termos. */
	termsChangeNoticeDays: 15,

	/** Exigido pela AGPL-3.0: onde o código-fonte desta instância está publicado. */
	sourceCodeUrl: 'https://github.com/GabrielVenas0/socialnite',

	/** Comarca eleita nos Termos, sem prejuízo do foro do consumidor. */
	jurisdiction: 'Salvador/BA',
} as const;
