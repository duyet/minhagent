export const prerender = false;

import type { APIRoute } from 'astro';
import { revokeGrant } from '../../../lib/oauth';

// CSRF is protected by Clerk's __client cookies (SameSite=Lax), which block
// cross-origin POST. The dashboard form submits same-site only.
export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const auth = locals.auth();
  if (!auth.userId) {
    return redirect('/login', 303);
  }

  const form = await request.formData();
  const tokenIdRaw = form.get('token_id');
  if (typeof tokenIdRaw !== 'string' || !tokenIdRaw.trim()) {
    return redirect('/dashboard?error=invalid_input', 303);
  }

  await revokeGrant(locals.runtime.env.OAUTH_KV, auth.userId, tokenIdRaw.trim());
  return redirect('/dashboard?status=revoked', 303);
};
