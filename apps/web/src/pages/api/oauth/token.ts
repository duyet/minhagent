export const prerender = false;

import type { APIRoute } from 'astro';
import {
  loadAndDeleteCode,
  verifyPKCE,
  storeToken,
  storeRefreshToken,
  loadAndDeleteRefreshToken,
  storeGrant,
  loadGrant,
  generateTokenId,
  TOKEN_TTL,
} from '../../../lib/oauth';

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, locals }) => {
  const kv = locals.runtime.env.OAUTH_KV;
  let params: URLSearchParams;

  const ct = request.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    const body = await request.json();
    params = new URLSearchParams(body);
  } else {
    const text = await request.text();
    params = new URLSearchParams(text);
  }

  const grantType = params.get('grant_type') ?? '';

  if (grantType === 'authorization_code') {
    const code = params.get('code') ?? '';
    const codeVerifier = params.get('code_verifier') ?? '';
    const clientId = params.get('client_id') ?? '';

    const record = await loadAndDeleteCode(kv, code);
    if (!record) {
      return json({ error: 'invalid_grant', error_description: 'Code not found or expired' }, 400);
    }

    if (record.clientId !== clientId) {
      return json({ error: 'invalid_client' }, 400);
    }

    const valid = await verifyPKCE(codeVerifier, record.codeChallenge);
    if (!valid) {
      return json({ error: 'invalid_grant', error_description: 'PKCE verification failed' }, 400);
    }

    const tokenId = generateTokenId();
    const accessToken = `at_${crypto.randomUUID().replace(/-/g, '')}`;
    const refreshToken = `rt_${crypto.randomUUID().replace(/-/g, '')}`;
    const tokenRecord = { userId: record.userId, scope: record.scope, tokenId };

    await storeToken(kv, accessToken, tokenRecord);
    await storeRefreshToken(kv, refreshToken, tokenRecord);
    await storeGrant(kv, record.userId, tokenId, { accessToken, refreshToken });

    return json({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: TOKEN_TTL,
      scope: record.scope,
    });
  }

  if (grantType === 'refresh_token') {
    const refreshToken = params.get('refresh_token') ?? '';
    // Rotation: a refresh token is single-use. Consuming it invalidates the
    // old token pair and issues a fresh one.
    const record = await loadAndDeleteRefreshToken(kv, refreshToken);
    if (!record) {
      return json({ error: 'invalid_grant', error_description: 'Refresh token not found' }, 400);
    }

    const oldGrant = await loadGrant(kv, record.userId, record.tokenId);
    if (oldGrant) {
      await kv.delete(`token:${oldGrant.accessToken}`);
    }

    const newAccessToken = `at_${crypto.randomUUID().replace(/-/g, '')}`;
    const newRefreshToken = `rt_${crypto.randomUUID().replace(/-/g, '')}`;

    await storeToken(kv, newAccessToken, record);
    await storeRefreshToken(kv, newRefreshToken, record);
    await storeGrant(kv, record.userId, record.tokenId, {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });

    return json({
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      token_type: 'Bearer',
      expires_in: TOKEN_TTL,
      scope: record.scope,
    });
  }

  return json({ error: 'unsupported_grant_type' }, 400);
};
