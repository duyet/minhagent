export const prerender = false;

import type { APIRoute } from 'astro';
import { resolveToken } from '../../../lib/oauth';

export const GET: APIRoute = async ({ request, locals }) => {
  const authHeader = request.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const kv = locals.runtime.env.OAUTH_KV;
  const tokenRecord = await resolveToken(kv, token);
  if (!tokenRecord) {
    return new Response(JSON.stringify({ error: 'invalid_token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const gatewayRaw = await kv.get(`gateway:${tokenRecord.userId}`);
  if (!gatewayRaw) {
    return new Response(JSON.stringify({ error: 'not_configured' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const gateway = JSON.parse(gatewayRaw);
  return new Response(JSON.stringify(gateway), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
