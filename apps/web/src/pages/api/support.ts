export const prerender = false;

import type { APIRoute } from 'astro';
import { getOAuthKV } from '../../lib/runtime';

// AI support assistant, powered by each signed-in user's own the router
// gateway key (the one they save on the dashboard). No server-side key is
// required: the button is "connected with the router" through the user's
// configured gateway. See https://the router.dev/docs/api-reference/chat-completions
const ROUTER_BASE = 'https://the router.dev/api/v1';
const SUPPORT_MODEL = 'anthropic/claude-haiku-4.5';
const SYSTEM_PROMPT = [
  'You are the MinhAgent support assistant (minhagent.dev).',
  'MinhAgent is a private AI assistant for Apple devices (macOS + iOS) that runs on-device',
  'or routes through a secure LLM gateway (the router / OpenRouter). The web app also acts as',
  "an OAuth 2.0 provider for the native apps and stores each user's gateway key.",
  'Answer concisely in at most 4 sentences. If you are unsure, point the user to https://minhagent.dev/docs.',
  'Never reveal API keys, tokens, or secrets.',
].join(' ');

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request, locals }) => {
  const auth = locals.auth();
  if (!auth.userId) return json({ error: 'unauthorized' }, 401);

  let payload: { message?: unknown } = {};
  try {
    payload = await request.json();
  } catch {
    /* malformed body → treated as empty below */
  }
  const message = typeof payload.message === 'string' ? payload.message.trim().slice(0, 2000) : '';
  if (!message) return json({ error: 'empty_message' }, 400);

  const kv = getOAuthKV();
  const raw = await kv.get(`gateway:${auth.userId}`);
  if (!raw) {
    return json({
      reply: 'Connect your the router gateway key in the dashboard and I can answer anything about MinhAgent.',
      action: { label: 'Open dashboard', href: '/dashboard#llm-gateway' },
    });
  }

  let gateway: { provider?: string; apiKey?: string };
  try {
    gateway = JSON.parse(raw);
  } catch {
    return json({ error: 'invalid_gateway' }, 500);
  }
  if (gateway.provider !== 'the router' || !gateway.apiKey) {
    return json({
      reply: 'AI support runs through the router. Set a the router gateway key in the dashboard to enable it.',
      action: { label: 'Open dashboard', href: '/dashboard#llm-gateway' },
    });
  }

  try {
    const upstream = await fetch(`${ROUTER_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${gateway.apiKey}`,
        'Content-Type': 'application/json',
        'X-the router-Title': 'MinhAgent Support',
        'X-the router-Source': 'minhagent-web',
      },
      body: JSON.stringify({
        model: SUPPORT_MODEL,
        max_tokens: 600,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: message },
        ],
      }),
    });
    if (!upstream.ok) return json({ error: 'upstream_error', status: upstream.status }, 502);

    const data = (await upstream.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = data?.choices?.[0]?.message?.content?.trim() ?? '';
    if (!reply) return json({ error: 'empty_reply' }, 502);
    return json({ reply });
  } catch {
    return json({ error: 'fetch_failed' }, 502);
  }
};
