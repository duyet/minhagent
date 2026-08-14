# Minh

Coding agent on Cloudflare Workers. Harness and session SQLite live in a Durable Object. Snippet tool uses Cloudflare Computer when bound, otherwise a Free-plan isolate.

- Chat: https://agent.minhagent.dev
- workers.dev: https://minh.anyr.workers.dev
- `POST /api/chat` `{ "message": "..." }`

```bash
pnpm --filter @minhagent/minh test
pnpm --filter @minhagent/minh deploy
```
