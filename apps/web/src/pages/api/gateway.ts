export const prerender = false;

import type { APIRoute } from 'astro';

const ALLOWED_PROVIDERS = ['anyrouter', 'openrouter'];

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const auth = locals.auth();
  if (!auth.userId) {
    return redirect('/login', 303);
  }

  const form = await request.formData();
  const kv = locals.runtime.env.OAUTH_KV;

  if (form.get('intent') === 'delete') {
    await kv.delete(`gateway:${auth.userId}`);
    return redirect('/dashboard?status=removed', 303);
  }

  const providerRaw = form.get('provider');
  const apiKeyRaw = form.get('apiKey');
  if (typeof providerRaw !== 'string' || typeof apiKeyRaw !== 'string') {
    return redirect('/dashboard?error=invalid_input', 303);
  }

  const provider = providerRaw.trim();
  const apiKey = apiKeyRaw.trim();

  if (!ALLOWED_PROVIDERS.includes(provider) || !apiKey) {
    return redirect('/dashboard?error=invalid_input', 303);
  }

  await kv.put(`gateway:${auth.userId}`, JSON.stringify({ provider, apiKey }));
  return redirect('/dashboard?status=saved', 303);
};
