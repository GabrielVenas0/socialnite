/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import fastifyCookie from '@fastify/cookie';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { IsNull } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import type { MiMeta, UserGoogleAccountsRepository, UsersRepository } from '@/models/_.js';
import type { MiLocalUser, MiUser } from '@/models/User.js';
import { IdService } from '@/core/IdService.js';
import { SignupService } from '@/core/SignupService.js';
import { SigninService } from '@/server/api/SigninService.js';
import { LoggerService } from '@/core/LoggerService.js';
import { bindThis } from '@/decorators.js';
import type Logger from '@/logger.js';
import type { FastifyInstance, FastifyPluginOptions, FastifyReply } from 'fastify';

const STATE_COOKIE_NAME = 'google_oauth_state';
const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_JWKS_URI = 'https://www.googleapis.com/oauth2/v3/certs';

const jwks = createRemoteJWKSet(new URL(GOOGLE_JWKS_URI));

/**
 * "Entrar com Google" (Sign in with Google). Replaces the old passkey button on the
 * signin screen. First-time sign-in with a given Google account auto-provisions a
 * local, password-less SocialNite account linked to it (see user_google_account).
 */
@Injectable()
export class SignInWithGoogleServerService {
	private logger: Logger;

	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.meta)
		private meta: MiMeta,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userGoogleAccountsRepository)
		private userGoogleAccountsRepository: UserGoogleAccountsRepository,

		private idService: IdService,
		private signupService: SignupService,
		private signinService: SigninService,
		private loggerService: LoggerService,
	) {
		this.logger = this.loggerService.getLogger('sign-in-with-google');
	}

	private get callbackUrl(): string {
		return `${this.config.url}/sign-in-with-google/callback`;
	}

	@bindThis
	private redirectToFrontend(reply: FastifyReply, params: Record<string, string>): void {
		// Note: this intentionally is NOT /sign-in-with-google/callback (that's the
		// server-side route below, which Google redirects to). This lands on the SPA.
		const hash = new URLSearchParams(params).toString();
		reply.redirect(`${this.config.url}/sign-in-with-google/done#${hash}`);
	}

	@bindThis
	public createServer(fastify: FastifyInstance, options: FastifyPluginOptions, done: (err?: Error) => void) {
		fastify.register(fastifyCookie);

		fastify.get('/sign-in-with-google', async (request, reply) => {
			if (!this.meta.enableGoogleSignin || !this.meta.googleClientId || !this.meta.googleClientSecret) {
				reply.code(404);
				return 'Google sign-in is not configured on this instance.';
			}

			const state = randomUUID();

			reply.setCookie(STATE_COOKIE_NAME, state, {
				path: '/sign-in-with-google',
				httpOnly: true,
				sameSite: 'lax',
				secure: this.config.url.startsWith('https'),
				maxAge: 600,
			});

			const params = new URLSearchParams({
				client_id: this.meta.googleClientId,
				redirect_uri: this.callbackUrl,
				response_type: 'code',
				scope: 'openid email profile',
				state,
				prompt: 'select_account',
			});

			reply.redirect(`${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`);
		});

		fastify.get<{
			Querystring: { code?: string; state?: string; error?: string; };
		}>('/sign-in-with-google/callback', async (request, reply) => {
			reply.clearCookie(STATE_COOKIE_NAME, { path: '/sign-in-with-google' });

			if (!this.meta.enableGoogleSignin || !this.meta.googleClientId || !this.meta.googleClientSecret) {
				return this.redirectToFrontend(reply, { error: 'not_configured' });
			}

			const { code, state, error } = request.query;

			if (error) {
				return this.redirectToFrontend(reply, { error });
			}

			const cookies = request.cookies as Record<string, string | undefined>;
			const cookieState = cookies[STATE_COOKIE_NAME];
			if (!code || !state || !cookieState || state !== cookieState) {
				return this.redirectToFrontend(reply, { error: 'invalid_state' });
			}

			let sub: string;
			let email: string | null;

			try {
				const tokenRes = await fetch(GOOGLE_TOKEN_ENDPOINT, {
					method: 'POST',
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
					body: new URLSearchParams({
						code,
						client_id: this.meta.googleClientId,
						client_secret: this.meta.googleClientSecret,
						redirect_uri: this.callbackUrl,
						grant_type: 'authorization_code',
					}),
				});

				if (!tokenRes.ok) {
					throw new Error(`Google token endpoint responded ${tokenRes.status}`);
				}

				const tokenBody = await tokenRes.json() as { id_token?: string };
				if (!tokenBody.id_token) {
					throw new Error('Google token response has no id_token');
				}

				const { payload } = await jwtVerify(tokenBody.id_token, jwks, {
					issuer: ['https://accounts.google.com', 'accounts.google.com'],
					audience: this.meta.googleClientId,
				});

				if (typeof payload.sub !== 'string') {
					throw new Error('Google id_token has no sub claim');
				}

				sub = payload.sub;
				email = (typeof payload.email === 'string' && payload.email_verified === true) ? payload.email : null;
			} catch (err) {
				this.logger.warn('Failed to exchange/verify the Google id_token', { err });
				return this.redirectToFrontend(reply, { error: 'auth_failed' });
			}

			try {
				const link = await this.userGoogleAccountsRepository.findOneBy({ googleId: sub });

				let user: MiLocalUser;

				if (link) {
					const found = await this.usersRepository.findOneBy({ id: link.userId, host: IsNull() });
					if (!found) {
						return this.redirectToFrontend(reply, { error: 'account_missing' });
					}
					if (found.isSuspended) {
						return this.redirectToFrontend(reply, { error: 'suspended' });
					}
					user = found as MiLocalUser;
				} else {
					user = await this.provisionUser(sub, email);
				}

				const result = this.signinService.signin(request, reply, user);
				return this.redirectToFrontend(reply, { token: result.i });
			} catch (err) {
				this.logger.error('Failed to resolve the local account for a Google sign-in', { err });
				return this.redirectToFrontend(reply, { error: 'auth_failed' });
			}
		});

		done();
	}

	@bindThis
	private async provisionUser(googleId: string, email: string | null): Promise<MiLocalUser> {
		const base = (email?.split('@')[0] ?? 'user').replace(/\W/g, '_').slice(0, 16) || 'user';

		let account: MiUser | null = null;
		let username = base;

		for (let i = 0; i < 10 && account == null; i++) {
			try {
				const created = await this.signupService.signup({
					username,
					ignorePreservedUsernames: false,
				});
				account = created.account;
			} catch (err) {
				if (err instanceof Error && (err.message === 'DUPLICATED_USERNAME' || err.message === 'USED_USERNAME')) {
					username = `${base}${Math.floor(Math.random() * 10000)}`;
					continue;
				}
				throw err;
			}
		}

		if (account == null) {
			throw new Error('Failed to generate a unique username while provisioning a Google sign-in account');
		}

		await this.userGoogleAccountsRepository.insert({
			id: this.idService.gen(),
			userId: account.id,
			googleId,
			email,
		});

		return account as MiLocalUser;
	}
}
