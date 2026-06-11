# @minhagent/web

Astro web app for MinhAgent — landing page, user dashboard, and OAuth 2.0 authorization server for the native Mac/iPhone client.

Runs on Cloudflare Workers via `@astrojs/cloudflare`. Auth is handled by Clerk. State (OAuth codes, tokens, gateway keys) is stored in a Cloudflare KV namespace.

---

## Setup

### 1. Install dependencies

```bash
bun install
```

### 2. Create the KV namespace

```bash
# Production
wrangler kv:namespace create OAUTH_KV

# Local dev (preview binding)
wrangler kv:namespace create OAUTH_KV --preview
```

Copy the returned `id` values into `wrangler.jsonc`:

```jsonc
"kv_namespaces": [
  {
    "binding": "OAUTH_KV",
    "id": "<production-id>",
    "preview_id": "<preview-id>"
  }
]
```

### 3. Configure Clerk

1. Create a Clerk application at https://clerk.com and note the publishable key and secret key.
2. Set the secret key as a Wrangler secret (never commit this):

```bash
wrangler secret put CLERK_SECRET_KEY
# paste sk_test_… when prompted
```

3. Update `wrangler.jsonc` vars with your actual publishable key:

```jsonc
"vars": {
  "PUBLIC_CLERK_PUBLISHABLE_KEY": "pk_test_…"
}
```

### 4. Local environment variables

Copy the example file and fill in real values:

```bash
cp .dev.vars.example .dev.vars
# edit .dev.vars with your Clerk keys
```

`.dev.vars` is read by `wrangler dev` / `astro dev --platform-proxy`. It is gitignored — never commit it.

### 5. Run locally

```bash
bun run dev
```

The dev server starts at `http://localhost:4321` with Cloudflare platform proxy enabled (KV, bindings all work locally via Miniflare).

---

## Deployment

```bash
bun run deploy
# equivalent to: astro build && wrangler deploy
```

This builds the Astro site, then deploys the `dist/_worker.js` entry point plus static assets to Cloudflare Workers.

### First-time checklist

- [ ] KV namespace IDs set in `wrangler.jsonc`
- [ ] `CLERK_SECRET_KEY` uploaded via `wrangler secret put`
- [ ] `PUBLIC_CLERK_PUBLISHABLE_KEY` set in `wrangler.jsonc` vars
- [ ] Clerk "Allowed redirect URLs" includes your Workers domain

---

## OAuth 2.0 Flow

MinhAgent.app uses the Authorization Code flow with PKCE (S256). The server does not support implicit or client-credentials grants.

**Registered clients**

| client_id       | redirect_uri                    |
|-----------------|---------------------------------|
| `minhagent-app` | `minhagent://oauth/callback`    |

**Scopes**

| scope            | description                          |
|------------------|--------------------------------------|
| `profile:read`   | Read the user's Clerk profile        |
| `anyrouter:read` | Read the user's stored gateway key   |

---

### Step 1 — Authorization request

Redirect the user's browser to:

```
GET /api/oauth/authorize
  ?response_type=code
  &client_id=minhagent-app
  &redirect_uri=minhagent%3A%2F%2Foauth%2Fcallback
  &scope=profile%3Aread%20anyrouter%3Aread
  &state=<random-state>
  &code_challenge=<base64url-sha256-of-verifier>
  &code_challenge_method=S256
```

If the user is not signed in they are redirected to `/login` first, then back to `/consent` after authentication.

The consent screen shows the requested scopes. On approval the server redirects to:

```
minhagent://oauth/callback?code=<uuid>&state=<state>
```

On denial:

```
minhagent://oauth/callback?error=access_denied&state=<state>
```

---

### Step 2 — Token exchange

```bash
curl -X POST https://<your-worker>.workers.dev/api/oauth/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'grant_type=authorization_code' \
  --data-urlencode 'code=<code-from-callback>' \
  --data-urlencode 'code_verifier=<original-pkce-verifier>' \
  --data-urlencode 'client_id=minhagent-app'
```

Response:

```json
{
  "access_token": "at_…",
  "refresh_token": "rt_…",
  "token_type": "Bearer",
  "expires_in": 2592000,
  "scope": "profile:read anyrouter:read"
}
```

---

### Step 3 — Refresh access token

```bash
curl -X POST https://<your-worker>.workers.dev/api/oauth/token \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data-urlencode 'grant_type=refresh_token' \
  --data-urlencode 'refresh_token=<rt_…>'
```

Response is the same shape as the token exchange but without a new `refresh_token` (the original stays valid).

---

### Step 4 — Use the token

Fetch the user's stored LLM gateway credentials (requires `anyrouter:read` scope):

```bash
curl https://<your-worker>.workers.dev/api/me/anyrouter \
  -H 'Authorization: Bearer at_…'
```

Response:

```json
{
  "provider": "anyrouter",
  "apiKey": "sk-…"
}
```

---

## Project structure

```
apps/web/
├── astro.config.mjs          # Astro + Cloudflare adapter + Clerk integration
├── wrangler.jsonc            # Worker config, KV bindings, vars
├── .dev.vars.example         # Template for local secrets
├── tsconfig.json
└── src/
    ├── env.d.ts              # Cloudflare runtime + Clerk type augmentation
    ├── middleware.ts          # Clerk middleware (runs on every SSR request)
    ├── lib/
    │   └── oauth.ts          # PKCE, KV helpers, token/code store
    └── pages/
        ├── index.astro        # Landing page (static, prerendered)
        ├── login.astro        # Clerk SignIn component
        ├── dashboard.astro    # Authenticated dashboard
        ├── consent.astro      # OAuth consent screen
        └── api/
            ├── gateway.ts              # POST — save LLM gateway key
            ├── me/
            │   └── anyrouter.ts        # GET — return gateway key (Bearer auth)
            └── oauth/
                ├── authorize.ts        # GET — start OAuth flow
                ├── decision.ts         # POST — process consent form
                └── token.ts            # POST — code exchange + refresh
```
