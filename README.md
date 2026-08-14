# Minh

Minh is the agent. This repo is the Minh product: a Next.js 16.3.1 chat UI and `/api/chat` worker, not a nested `chatbot-template` folder and not a separate Worker-only UI.

Live: [minhagent.dev](https://minhagent.dev) (apex). Cloudflare Worker name: `minhagent-web`.

## What it does

- Streaming chat (AI SDK + shadcn chat primitives)
- `POST /api/chat` — public chat endpoint
- `execute_snippet` — small JavaScript on Cloudflare Computer, with an isolate fallback
- Other tools (time, search, etc.) as defined under `tools/`

## Dev

```bash
pnpm install
pnpm dev
```

Opens the Next.js app locally. Copy `.env.example` to `.env.local` and set the AnyRouter key the chat route already expects (`ANYROUTER_API_KEY`). Do not commit keys.

## Deploy

```bash
pnpm deploy
```

`next build` + `scripts/pack-assets.sh` + Wrangler. Thin worker (`worker.ts`) + static assets under `deploy-assets/` — not a full OpenNext bundle. Worker **minhagent-web**, apex custom domain **minhagent.dev**.

## Layout (intended)

Product lives at the repo root:

- `app/` — Next.js App Router (`page.tsx`, `app/api/chat/route.ts`)
- `components/` — chat UI
- `tools/` — model tools, including `execute_snippet`
- `lib/` — models, persona, gateway helpers
- `wrangler.jsonc` — Worker `minhagent-web`, route `minhagent.dev`

`apps/webhook` remains the GitHub App webhook receiver if you still need it; it is not the Minh UI.

## Security

`/api/chat` is unauthenticated. Every request spends your model credits. Rate-limit and cap spend before public traffic.
