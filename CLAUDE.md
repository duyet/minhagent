# CLAUDE.md

Guidance for working in this repository.

## Product

**Minh is the agent.** Eve-shaped authoring under `agent/`, chat UI at the repo root, Worker `minhagent-web` on minhagent.dev.

- Chat: `POST /api/chat`
- Tools: `agent/tools/` (filename = name). `execute_snippet` is first-class.
- Do not recreate a second Worker UI, landing site, or webhook package.

## Commands

```bash
pnpm dev          # Next.js
pnpm build        # next build
pnpm typecheck    # tsc --noEmit
pnpm test         # node:test
pnpm deploy       # next build + pack-assets + wrangler
```

## Architecture

- Next.js App Router at root (`app/`). `app/api/chat/route.ts` streams an AI SDK `ToolLoopAgent`.
- Authoring: `agent/instructions`, `agent/tools/`, `agent/connections/`. Implementations live in `tools/`. The thin Worker does not run Eve’s Vercel/Nitro durable runtime.
- Deploy: thin `worker.ts` + `deploy-assets/`. Wrangler `name`: `minhagent-web`. Apex only: `minhagent.dev`.
- `/api/chat` is public unless you add auth.

## Secrets

Set locally in `.env.local` (gitignored). On the Worker, use wrangler secrets.

Typical chat key: `ANYROUTER_API_KEY` (prefix `sk-ar-`).

GitHub Actions: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.

## CI

Push to `main` may typecheck. Typecheck must pass before deploy.

## Gotchas

- Never run concurrent `wrangler deploy` from parallel agents — OOM.
