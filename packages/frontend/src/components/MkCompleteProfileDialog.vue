<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModalWindow
	ref="dialog"
	:width="420"
	:canClose="false"
	:withOkButton="false"
	@closed="emit('closed')"
>
	<template #header>Complete seu cadastro</template>

	<div class="_spacer" style="--MI_SPACER-w: 420px;">
		<div class="_gaps">
			<MkInfo>
				Para conseguir recuperar sua senha e receber avisos, precisamos do seu e-mail e do seu telefone.
			</MkInfo>

			<MkInput v-if="needsEmail" v-model="email" type="email" :spellcheck="false">
				<template #label>E-mail</template>
				<template #prefix><i class="ti ti-mail"></i></template>
				<template #caption>Enviaremos um link para você confirmar o endereço.</template>
			</MkInput>

			<MkInput v-if="needsPhone" v-model="phone" type="tel" :spellcheck="false">
				<template #label>Telefone</template>
				<template #prefix><i class="ti ti-phone"></i></template>
			</MkInput>

			<MkButton primary rounded :disabled="!canSubmit" @click="save">Salvar</MkButton>
		</div>
	</div>
</MkModalWindow>
</template>

<script lang="ts" setup>
import { computed, ref, useTemplateRef } from 'vue';
import MkModalWindow from '@/components/MkModalWindow.vue';
import MkInput from '@/components/MkInput.vue';
import MkButton from '@/components/MkButton.vue';
import MkInfo from '@/components/MkInfo.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { $i } from '@/i.js';

const props = defineProps<{
	needsEmail: boolean;
	needsPhone: boolean;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const dialog = useTemplateRef('dialog');

const email = ref('');
const phone = ref('');

const canSubmit = computed(() => {
	if (props.needsEmail && email.value.length === 0) return false;
	if (props.needsPhone && phone.value.length === 0) return false;
	return true;
});

async function save() {
	try {
		if (props.needsPhone) {
			await misskeyApi('i/update', { phone: phone.value } as never);
			if ($i != null) $i.phone = phone.value;
		}

		if (props.needsEmail) {
			// Sem senha: o backend só dispensa quando a conta ainda não tem e-mail.
			await misskeyApi('i/update-email', { email: email.value } as never);
			if ($i != null) $i.email = email.value;
		}
	} catch (err) {
		await os.alert({
			type: 'error',
			text: err instanceof Error ? err.message : 'Não foi possível salvar. Confira os dados e tente de novo.',
		});
		return;
	}

	await os.alert({
		type: 'success',
		text: props.needsEmail ? 'Pronto! Confira sua caixa de entrada para confirmar o e-mail.' : 'Pronto!',
	});

	dialog.value?.close();
}
</script>
