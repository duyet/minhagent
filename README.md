# Minh

Minh is an Eve-shaped coding agent with a chat UI. Live: [minhagent.dev](https://minhagent.dev). Worker: `minhagent-web`.

## What it does

- Streaming chat (AI SDK `ToolLoopAgent`)
- `POST /api/chat`
- Tools authored under `agent/tools/` (filename = name), including `execute_snippet`

## Dev

```bash
pnpm install
pnpm dev
```

Copy `.env.example` to `.env.local` and set `ANYROUTER_API_KEY`. Do not commit keys.

## Deploy

```bash
pnpm deploy
```

`next build` + `scripts/pack-assets.sh` + Wrangler. Thin worker (`worker.ts`) + `deploy-assets/`.

## Layout

- `agent/` — Eve layout: instructions, tools, MCP connections
- `app/` — Next.js chat UI and `/api/chat`
- `tools/` — tool implementations
- `lib/` — AnyRouter, snippet, persona
- `wrangler.jsonc` — Worker `minhagent-web`

## Security

`/api/chat` is unauthenticated. Every request spends model credits.
