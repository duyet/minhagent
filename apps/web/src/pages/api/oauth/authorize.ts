export const prerender = false;

import type { APIRoute } from 'astro';
import { validateClient } from '../../../lib/oauth';

export const GET: APIRoute = async ({ request, locals, redirect }) => {
  const url = new URL(request.url);
  const clientId = url.searchParams.get('client_id') ?? '';
  const redirectUri = url.searchParams.get('redirect_uri') ?? '';
  const responseType = url.searchParams.get('response_type') ?? '';
  const codeChallenge = url.searchParams.get('code_challenge') ?? '';
  const codeChallengeMethod = url.searchParams.get('code_challenge_method') ?? '';
  const state = url.searchParams.get('state') ?? '';
  const scope = url.searchParams.get('scope') ?? 'profile:read';

  if (responseType !== 'code') {
    return new Response(JSON.stringify({ error: 'unsupported_response_type' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!validateClient(clientId, redirectUri)) {
    return new Response(JSON.stringify({ error: 'invalid_client' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!codeChallenge || codeChallengeMethod !== 'S256') {
    return new Response(JSON.stringify({ error: 'invalid_request', error_description: 'PKCE S256 required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const auth = locals.auth();
  if (!auth.userId) {
    const loginUrl = new URL('/login', url.origin);
    loginUrl.searchParams.set('redirect_url', request.url);
    return redirect(loginUrl.toString(), 302);
  }

  const consentUrl = new URL('/consent', url.origin);
  consentUrl.searchParams.set('client_id', clientId);
  consentUrl.searchParams.set('redirect_uri', redirectUri);
  consentUrl.searchParams.set('scope', scope);
  consentUrl.searchParams.set('state', state);
  consentUrl.searchParams.set('code_challenge', codeChallenge);
  consentUrl.searchParams.set('code_challenge_method', codeChallengeMethod);
  return redirect(consentUrl.toString(), 302);
};
