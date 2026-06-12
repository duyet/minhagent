export const prerender = false;

import type { APIRoute } from 'astro';
import { revokeGrant } from '../../../lib/oauth';

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const auth = locals.auth();
  if (!auth.userId) {
    return redirect('/login', 303);
  }

  const form = await request.formData();
  const tokenId = String(form.get('token_id') ?? '').trim();
  if (!tokenId) {
    return redirect('/dashboard?error=invalid_input', 303);
  }

  await revokeGrant(locals.runtime.env.OAUTH_KV, auth.userId, tokenId);
  return redirect('/dashboard?status=revoked', 303);
};
