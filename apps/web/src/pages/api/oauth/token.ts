export const prerender = false;

import type { APIRoute } from 'astro';
import {
  loadAndDeleteCode,
  verifyPKCE,
  storeToken,
  generateTokenId,
  grantExists,
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

    await storeToken(kv, accessToken, { userId: record.userId, scope: record.scope, tokenId });
    await kv.put(
      `refresh:${refreshToken}`,
      JSON.stringify({ userId: record.userId, scope: record.scope, tokenId }),
      { expirationTtl: 30 * 24 * 60 * 60 },
    );

    return json({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 30 * 24 * 60 * 60,
      scope: record.scope,
    });
  }

  if (grantType === 'refresh_token') {
    const refreshToken = params.get('refresh_token') ?? '';
    const raw = await kv.get(`refresh:${refreshToken}`);
    if (!raw) {
      return json({ error: 'invalid_grant', error_description: 'Refresh token not found' }, 400);
    }
    const record = JSON.parse(raw) as { userId: string; scope: string; tokenId: string };

    // A revoked grant must not be resurrectable via its refresh token
    if (!(await grantExists(kv, record.userId, record.tokenId))) {
      await kv.delete(`refresh:${refreshToken}`);
      return json({ error: 'invalid_grant', error_description: 'Grant has been revoked' }, 400);
    }

    const newAccessToken = `at_${crypto.randomUUID().replace(/-/g, '')}`;
    await storeToken(kv, newAccessToken, {
      userId: record.userId,
      scope: record.scope,
      tokenId: record.tokenId,
    });

    return json({
      access_token: newAccessToken,
      token_type: 'Bearer',
      expires_in: 30 * 24 * 60 * 60,
      scope: record.scope,
    });
  }

  return json({ error: 'unsupported_grant_type' }, 400);
};
