# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Monorepo

pnpm workspace with two Cloudflare Workers apps:
- `apps/web` — Astro 6 + @astrojs/cloudflare + @clerk/astro (minhagent.dev)
- `apps/webhook` — Hono 4 GitHub webhook receiver (minhagent-webhook.duyet.workers.dev)

## Commands

```bash
pnpm dev:web          # Astro dev server
pnpm dev:webhook      # Wrangler dev
pnpm build            # Build both apps
pnpm typecheck        # astro check + tsc --noEmit (both apps)
pnpm deploy:web       # Build + wrangler deploy web
pnpm deploy:webhook   # Wrangler deploy webhook
```

Filter by package: `pnpm --filter @minhagent/web <cmd>`, `pnpm --filter @minhagent/webhook <cmd>`

## Architecture

- **Web** uses a shared `BaseLayout.astro` with light-first CSS + dark mode via `prefers-color-scheme`. All pages use it.
- **Web** is also an OAuth 2.0 PKCE provider for MinhAgent native app (`src/lib/oauth.ts`). Client: `minhagent-app`, redirect: `minhagent://oauth/callback`.
- **Webhook** verifies GitHub HMAC-SHA256 signatures. Routes events to Cloudflare Workflows.
- Auth: Clerk handles sign-in/sign-up. Protected pages call `Astro.locals.auth()`.

## Secrets

- **web worker**: `CLERK_SECRET_KEY` (wrangler secret), `PUBLIC_CLERK_PUBLISHABLE_KEY` (wrangler var)
- **webhook worker**: `GITHUB_WEBHOOK_SECRET` (wrangler secret)
- **GitHub repo**: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`

## CI

Push to `main` triggers `.github/workflows/deploy.yml`: build → typecheck → deploy webhook → deploy web.
Typecheck must pass before deploy.

## Gotchas

- `apps/web` uses `output: 'static'` with individual pages opting into SSR via `export const prerender = false`
- `.assetsignore` in `apps/web/public/` excludes `_worker.js` from static asset upload — do not remove
- Never run concurrent `wrangler deploy` from parallel agents — causes OOM
- Webhook secret rotation: `./scripts/rotate-webhook-secret.sh`
