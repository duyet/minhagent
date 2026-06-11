export const prerender = false;

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals, redirect }) => {
  const auth = locals.auth();
  if (!auth.userId) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const form = await request.formData();
  const provider = form.get('provider') as string;
  const apiKey = form.get('apiKey') as string;

  if (!provider || !apiKey) {
    return new Response(JSON.stringify({ error: 'missing fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const kv = locals.runtime.env.OAUTH_KV;
  await kv.put(`gateway:${auth.userId}`, JSON.stringify({ provider, apiKey }));

  return redirect('/dashboard', 303);
};
