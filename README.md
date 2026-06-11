# minhagent

Landing site and GitHub App webhook for MinhAgent. Deploys to Cloudflare Workers.

## Apps

- **`apps/web`** — [minhagent.dev](https://minhagent.dev) — Astro + Clerk on CF Workers. Landing page, auth, OAuth provider for MinhAgent.app.
- **`apps/webhook`** — [webhook.minhagent.dev](https://webhook.minhagent.dev) — Hono on CF Workers. GitHub App webhook receiver.

## Quick start

```bash
pnpm install
pnpm dev:web        # Astro dev server
pnpm dev:webhook    # wrangler dev
```

## Deploy

```bash
pnpm deploy:web
pnpm deploy:webhook
```

## Secrets

```bash
# apps/web
wrangler secret put CLERK_SECRET_KEY

# apps/webhook
wrangler secret put GITHUB_WEBHOOK_SECRET
```
