export const prerender = false;

import type { APIRoute } from 'astro';
import { validateClient, storeCode } from '../../../lib/oauth';

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const auth = locals.auth();
  if (!auth.userId) {
    return redirect('/login', 302);
  }

  const form = await request.formData();
  const decision = form.get('decision') as string;
  const clientId = form.get('client_id') as string;
  const redirectUri = form.get('redirect_uri') as string;
  const scope = form.get('scope') as string;
  const state = form.get('state') as string;
  const codeChallenge = form.get('code_challenge') as string;
  const codeChallengeMethod = form.get('code_challenge_method') as string;

  if (!validateClient(clientId, redirectUri)) {
    return new Response('Invalid client', { status: 400 });
  }

  // /api/oauth/authorize enforces this too, but this endpoint accepts direct POSTs
  if (!codeChallenge || codeChallengeMethod !== 'S256') {
    return new Response('PKCE S256 required', { status: 400 });
  }

  const callbackUrl = new URL(redirectUri);

  // Only an explicit "allow" authorizes; anything else is a denial
  if (decision !== 'allow') {
    callbackUrl.searchParams.set('error', 'access_denied');
    if (state) callbackUrl.searchParams.set('state', state);
    return redirect(callbackUrl.toString(), 302);
  }

  const code = crypto.randomUUID();
  const kv = locals.runtime.env.OAUTH_KV;

  await storeCode(kv, code, {
    userId: auth.userId,
    clientId,
    redirectUri,
    codeChallenge,
    scope,
    exp: Date.now() + 5 * 60 * 1000,
  });

  callbackUrl.searchParams.set('code', code);
  if (state) callbackUrl.searchParams.set('state', state);
  return redirect(callbackUrl.toString(), 302);
};
