# minhagent

Monorepo for MinhAgent — landing site, GitHub App webhook, and OAuth for the MinhAgent.app (macOS/iOS) clients. Everything deploys to Cloudflare Workers.

## Apps

| App | Domain | Stack | Purpose |
|-----|--------|-------|---------|
| `apps/web` | minhagent.dev | Astro + Clerk on CF Workers | Landing page (static assets), login/consent, user dashboard, OAuth provider for MinhAgent.app |
| `apps/webhook` | webhook.minhagent.dev | Hono on CF Workers | GitHub App webhook receiver → Cloudflare Workflows |

## Architecture

```
GitHub App ──webhook──▶ apps/webhook ──▶ verify HMAC ──▶ log ──▶ Cloudflare Workflow (per event/action map)

MinhAgent.app (iOS/macOS)
   └─ OAuth code+PKCE ──▶ minhagent.dev/oauth/authorize
                              └─ Clerk sign-in ─▶ consent screen ─▶ token (KV)
                                    └─ token grants access to AnyRouter creds API
```

### Cost notes

- Landing page is served as Workers Static Assets (free, unmetered).
- One worker serves landing + auth + dashboard; only SSR/API routes count as invocations.
- OAuth state lives in KV (free tier). No D1/Queues until needed.
- Webhook handler logs via Workers observability; no storage cost.

## Development

```bash
bun install
bun run dev:web        # Astro dev server
bun run dev:webhook    # wrangler dev
```

Secrets (per app, via `wrangler secret put`):

- `apps/web`: `CLERK_SECRET_KEY` (+ `PUBLIC_CLERK_PUBLISHABLE_KEY` var)
- `apps/webhook`: `GITHUB_WEBHOOK_SECRET`

## Deploy

```bash
bun run deploy:web
bun run deploy:webhook
```
