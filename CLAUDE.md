# CLAUDE.md

Guidance for working in this repository.

## Product

**Minh is the agent.** The product is the Next.js 16.3.1 chat app at the **repo root** (from the old chatbot template). Do not treat Minh as `chatbot-template/` or as a separate Worker UI under `apps/minh`.

- Site: minhagent.dev (apex)
- Worker: `minhagent-web`
- Chat: `POST /api/chat` with the `execute_snippet` tool (Cloudflare Computer / isolate fallback)

## Commands

```bash
pnpm dev          # Next.js
pnpm build        # next build
pnpm typecheck    # tsc --noEmit
pnpm test         # node:test (tools, etc.)
pnpm deploy       # next build + pack-assets + wrangler (thin worker)
```

If a webhook package still lives under `apps/webhook`:

```bash
pnpm --filter @minhagent/webhook dev
pnpm --filter @minhagent/webhook deploy
```

## Architecture

- Next.js App Router at root (`app/`). Pages and `app/api/chat/route.ts` stream with AI SDK `streamText`.
- Tools live in `tools/` (filename = tool name). `execute_snippet` is first-class for arithmetic / tiny JS.
- Persona: Minh. Never call the product a chatbot template.
- Deploy: thin `worker.ts` + `deploy-assets/` (Free plan). Wrangler `name`: `minhagent-web`. Custom domain: `minhagent.dev` (apex only).
- Auth for the marketing/OAuth Astro site is not this app. Minh chat `/api/chat` is public unless you add auth.

## Secrets

Set locally in `.env.local` (gitignored). On the Worker, use wrangler secrets — do not invent or paste credentials in docs or commits.

Typical chat key: `ANYROUTER_API_KEY` (prefix `sk-ar-`).

Webhook (if present): `GITHUB_WEBHOOK_SECRET`.

GitHub Actions (if deploy workflow exists): `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

## CI

Push to `main` may build, typecheck, and deploy `minhagent-web`. Typecheck must pass before deploy.

## Gotchas

- Never run concurrent `wrangler deploy` from parallel agents — OOM.
- Do not describe or recreate a second Worker UI for Minh.
- Do not point docs at `chatbot-template/` as the product path; root is the intended layout.
