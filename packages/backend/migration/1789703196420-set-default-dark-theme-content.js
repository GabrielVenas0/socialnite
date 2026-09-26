/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// defaultDarkTheme must hold the FULL theme definition as a JSON5 string (see
// admin/branding.vue's textarea + MetaEntityService.ts's JSON5.parse), not a
// theme id. Previous migrations wrongly stored just 'd_social_nite', which
// failed to parse and silently fell back to null - this stores the actual
// content of themes/d_social_nite.json5.
const THEME_JSON5 = "// ダークテーマのベーステーマ\n// このテーマが直接使われることは無い\n{\n\tid: 'd_social_nite',\n\n\tname: 'Dark Social Nite',\n\tauthor: 'Carlos Ramirez',\n\tdesc: 'Default dark theme',\n\tkind: 'dark',\n\n\tprops: {\n\t\taccent: '#0972c4',\n\t\taccentedBg: ':alpha<0.15<@accent',\n\t\tlove: '#dd2e44',\n\t\tfocus: ':alpha<0.1<@accent',\n\t\tbg: 'rgb(20, 19, 24)',\n\t\tfg: '#dadada',\n\t\tfgHighlighted: ':lighten<3<@fg',\n\t\tfgOnAccent: '#fff',\n\t\tfgOnWhite: '#a7a7a7',\n\t\tdivider: 'rgba(255, 255, 255, 0.1)',\n\t\tindicator: '@accent',\n\t\tpanel: ':lighten<3<@bg',\n\t\tpanelHighlight: ':lighten<3<@panel',\n\t\tpanelHeaderBg: ':lighten<3<@panel',\n\t\tpanelHeaderFg: '@fg',\n\t\tpanelBorder: '\" solid 1px var(--MI_THEME-divider)',\n\t\twindowHeader: ':alpha<0.85<@panel',\n\t\tpopup: ':lighten<3<@panel',\n\t\tshadow: 'rgba(0, 0, 0, 0.3)',\n\t\theader: ':alpha<0.7<@panel',\n\t\tnavBg: '@panel',\n\t\tnavFg: '@fg',\n\t\tnavActive: '@accent',\n\t\tnavIndicator: '@indicator',\n\t\tpageHeaderBg: '@bg',\n\t\tpageHeaderFg: '@fg',\n\t\tlink: '#44a4c1',\n\t\thashtag: '#ff9156',\n\t\tmention: '@accent',\n\t\tmentionMe: '@mention',\n\t\trenote: '#229e82',\n\t\tmodalBg: 'rgba(0, 0, 0, 0.5)',\n\t\tscrollbarHandle: 'rgba(255, 255, 255, 0.2)',\n\t\tscrollbarHandleHover: 'rgba(255, 255, 255, 0.4)',\n\t\tdateLabelFg: '@fg',\n\t\tinfoBg: '#253142',\n\t\tinfoFg: '#fff',\n\t\tinfoWarnBg: '#42321c',\n\t\tinfoWarnFg: '#ffbd3e',\n\t\tfolderHeaderBg: 'rgba(255, 255, 255, 0.05)',\n\t\tfolderHeaderHoverBg: 'rgba(255, 255, 255, 0.1)',\n\t\tbuttonBg: ':lighten<5<@panel',\n\t\tbuttonHoverBg: ':lighten<10<@panel',\n\t\tbuttonGradateA: '@accent',\n\t\tbuttonGradateB: ':hue<20<@accent',\n\t\tswitchBg: 'rgba(255, 255, 255, 0.15)',\n\t\tswitchOffBg: 'rgba(255, 255, 255, 0.1)',\n\t\tswitchOffFg: ':alpha<0.8<@fg',\n\t\tswitchOnBg: '@accentedBg',\n\t\tswitchOnFg: '@accent',\n\t\tinputBorder: 'rgba(255, 255, 255, 0.1)',\n\t\tinputBorderHover: 'rgba(255, 255, 255, 0.2)',\n\t\tbadge: '#31b1ce',\n\t\tmessageBg: '@bg',\n\t\tsuccess: '#86b300',\n\t\terror: '#ec4137',\n\t\twarn: '#ecb637',\n\t\tcodeString: '#ffb675',\n\t\tcodeNumber: '#cfff9e',\n\t\tcodeBoolean: '#c59eff',\n\t\tdeckBg: '#000',\n\t\thtmlThemeColor: '@bg',\n\t},\n\n\tcodeHighlighter: {\n\t\tbase: 'one-dark-pro',\n\t},\n}\n";

export class SetDefaultDarkThemeContent1789703196420 {
    name = 'SetDefaultDarkThemeContent1789703196420'

    async up(queryRunner) {
        await queryRunner.query(`UPDATE "meta" SET "defaultDarkTheme" = $1`, [THEME_JSON5]);
    }

    async down(queryRunner) {
        await queryRunner.query(`UPDATE "meta" SET "defaultDarkTheme" = NULL`);
    }
}
