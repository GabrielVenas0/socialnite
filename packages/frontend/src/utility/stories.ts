/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as Misskey from 'misskey-js';
import { misskeyApi } from '@/utility/misskey-api.js';

export type Story = {
	id: string;
	createdAt: string;
	expiresAt: string;
	userId: string;
	user: Misskey.entities.UserLite;
	file: Misskey.entities.DriveFile | null; // null: story só com texto
	text: string | null;
	isViewed: boolean;
};

export type StoryGroup = {
	user: Misskey.entities.UserLite;
	stories: Story[];
	hasUnviewed: boolean;
};

// Os endpoints de stories são do Social Nite e não existem no autogen do misskey-js.
// O cast fica preso aqui para que o resto do app continue tipado.
function call<T>(endpoint: string, data: Record<string, unknown> = {}): Promise<T> {
	return misskeyApi(endpoint as never, data as never) as Promise<T>;
}

export function fetchStoryTimeline(): Promise<StoryGroup[]> {
	return call<StoryGroup[]>('stories/timeline');
}

export function createStory(params: {
	fileId: string | null;
	text: string | null;
	keepFile: boolean;
}): Promise<Story> {
	return call<Story>('stories/create', params);
}

export function markStoryViewed(storyId: string): Promise<void> {
	return call<void>('stories/view', { storyId });
}

export function deleteStory(storyId: string): Promise<void> {
	return call<void>('stories/delete', { storyId });
}
