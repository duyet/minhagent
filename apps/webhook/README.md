# minhagent-webhook

Cloudflare Worker that receives GitHub App webhooks, verifies HMAC-SHA256 signatures, and fans events out to Cloudflare Workflows for async processing.

## Register the GitHub App

1. Go to your GitHub App settings → Webhook.
2. Set **Webhook URL**: `https://webhook.minhagent.dev/webhook`
3. Generate a random secret and save it:
   ```bash
   wrangler secret put GITHUB_WEBHOOK_SECRET
   ```
4. Select the events you want to receive (or "Send me everything").
5. Save & enable the webhook.

## Local development

```bash
# 1. Copy the example vars file and set your secret
cp .dev.vars.example .dev.vars
# Edit .dev.vars and set a real GITHUB_WEBHOOK_SECRET value

# 2. Start the dev server (hot-reload)
bun run dev
# or: wrangler dev
```

The Worker listens on `http://localhost:8787` by default.

### Send a test webhook with a valid signature

```bash
SECRET="changeme"
PAYLOAD='{"action":"opened","repository":{"full_name":"org/repo"},"sender":{"login":"octocat"},"installation":{"id":12345}}'
DELIVERY="test-$(date +%s)"

SIG=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$SECRET" -hex | awk '{print "sha256="$2}')

curl -s -X POST http://localhost:8787/webhook \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: pull_request" \
  -H "X-GitHub-Delivery: $DELIVERY" \
  -H "X-Hub-Signature-256: $SIG" \
  -d "$PAYLOAD"
```

Expected response: `{"ok":true,"deliveryId":"<DELIVERY>"}` with HTTP 202.

## Deploy

```bash
bun run deploy
# or: wrangler deploy
```

## Regenerate types after changing wrangler.jsonc bindings

```bash
bun run types
# or: wrangler types
```

This generates `worker-configuration.d.ts` with a typed `Env` interface. Update `src/types.ts` accordingly (or delete the hand-written `Env` and import the generated one).
