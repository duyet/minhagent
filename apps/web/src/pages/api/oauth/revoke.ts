export const prerender = false;

import type { APIRoute } from 'astro';
import { revokeGrant } from '../../../lib/oauth';

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const auth = locals.auth();
  if (!auth.userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const form = await request.formData();
  const tokenId = form.get('tokenId');
  if (typeof tokenId !== 'string' || !tokenId) {
    return new Response('Missing tokenId', { status: 400 });
  }

  const kv = locals.runtime.env.OAUTH_KV;
  await revokeGrant(kv, auth.userId, tokenId);

  return redirect('/dashboard', 303);
};
