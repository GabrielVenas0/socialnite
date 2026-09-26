<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkLoading/>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { login } from '@/accounts.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import { definePage } from '@/page.js';
import MkLoading from '@/pages/_loading_.vue';

onMounted(async () => {
	const params = new URLSearchParams(location.hash.replace(/^#/, ''));
	const token = params.get('token');
	const error = params.get('error');

	if (token) {
		await login(token);
		return;
	}

	const message = error === 'suspended' ? i18n.ts.userSuspended
		: error === 'access_denied' ? i18n.ts.cancel
		: i18n.ts.somethingHappened;

	await os.alert({
		type: 'error',
		title: i18n.ts.loginFailed,
		text: message,
	});

	location.href = '/';
});

definePage(() => ({
	title: i18n.ts.signinWithGoogle,
}));
</script>
