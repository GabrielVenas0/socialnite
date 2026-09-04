<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkContainer :style="`height: ${widgetProps.height}px;`" :showHeader="widgetProps.showHeader" :scrollable="true" data-cy-mkw-notifications class="mkw-notifications">
	<template #icon><i class="ti ti-bell"></i></template>
	<template #header>{{ i18n.ts.notifications }}</template>
	<template #func="{ buttonStyleClass }"><button class="_button" :class="buttonStyleClass" @click="configureNotification()"><i class="ti ti-settings"></i></button></template>

	<div>
		<MkTab v-model="tab" :tabs="tabs" :class="$style.tabs"/>
		<MkStreamingNotificationsTimeline v-if="tab === 'all'" :excludeTypes="widgetProps.excludeTypes"/>
		<MkFollowRequestList v-else :type="tab"/>
	</div>
</MkContainer>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useWidgetPropsManager } from './widget.js';
import type { notificationTypes as notificationTypes_typeReferenceOnly } from 'misskey-js';
import type { WidgetComponentEmits, WidgetComponentExpose, WidgetComponentProps } from './widget.js';
import type { FormWithDefault, GetFormResultType } from '@/utility/form.js';
import MkContainer from '@/components/MkContainer.vue';
import MkStreamingNotificationsTimeline from '@/components/MkStreamingNotificationsTimeline.vue';
import MkTab from '@/components/MkTab.vue';
import MkFollowRequestList from '@/components/MkFollowRequestList.vue';
import * as os from '@/os.js';
import { i18n } from '@/i18n.js';
import { $i } from '@/i.js';

const name = 'notifications';

const tab = ref<'all' | 'list' | 'sent'>('all');

const tabs = computed(() => [
	{ key: 'all' as const, label: i18n.ts.all },
	{ key: 'list' as const, label: i18n.ts._followRequest.recieved, indicate: $i != null && $i.hasPendingReceivedFollowRequest },
	{ key: 'sent' as const, label: i18n.ts._followRequest.sent },
]);

const widgetPropsDef = {
	showHeader: {
		type: 'boolean',
		default: true,
	},
	height: {
		type: 'number',
		default: 300,
	},
	excludeTypes: {
		type: 'array',
		hidden: true,
		default: [] as (typeof notificationTypes_typeReferenceOnly[number])[],
	},
} satisfies FormWithDefault;

type WidgetProps = GetFormResultType<typeof widgetPropsDef>;

const props = defineProps<WidgetComponentProps<WidgetProps>>();
const emit = defineEmits<WidgetComponentEmits<WidgetProps>>();

const { widgetProps, configure, save } = useWidgetPropsManager(name,
	widgetPropsDef,
	props,
	emit,
);

const configureNotification = async () => {
	const { dispose } = await os.popupAsyncWithDialog(import('@/components/MkNotificationSelectWindow.vue').then(x => x.default), {
		excludeTypes: widgetProps.excludeTypes,
	}, {
		done: async (res) => {
			const { excludeTypes } = res;
			widgetProps.excludeTypes = excludeTypes;
			save();
		},
		closed: () => dispose(),
	});
};

defineExpose<WidgetComponentExpose>({
	name,
	configure,
	id: props.widget ? props.widget.id : null,
});
</script>

<style lang="scss" module>
.tabs {
	padding: 8px 8px 0;
	position: sticky;
	top: 0;
	z-index: 1;
	background: var(--MI_THEME-panel);
}
</style>
