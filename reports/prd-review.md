# MinhAgent — PRD Fidelity & Complexity Review

## 1. Executive Summary

The repo is, on the whole, a faithful and lean implementation of the PRD vision: a Clerk-authenticated web app that doubles as an OAuth 2.0 PKCE provider, plus a Hono webhook receiver that fans GitHub events into Cloudflare Workflows. The OAuth core (S256 PKCE, short-lived one-time auth codes, signature verification) is genuinely implemented and matches the security model. The dominant theme of the findings is **gap between what the PRD/UI claims is shipped and what the code actually does** — concentrated in two areas: (1) the OAuth lifecycle is incomplete (no refresh-token rotation, no revocation endpoint) while the PRD Feature Matrix and the consent screen tell users these exist, and (2) parts of the GitHub automation pipeline (the routing table, the Workflow body) are scaffolding marked "Implemented" but doing no real work yet. A secondary theme is **documentation drift**: the webhook's production URL is asserted in three places but wired in none, and both app READMEs use `bun` in a `pnpm`-enforced workspace. There is also a small amount of removable dead plumbing (a dropped `code_challenge_method`, a dead `computedHex`, a never-read JSON branch in the token endpoint) and a brittle CI hack (`sed` + `git checkout` on `wrangler.jsonc`). None of these are architectural; the codebase is small and the fixes are surgical. The single most user-impacting bug is that the OAuth `authorize` endpoint loses all PKCE state when an unauthenticated user is bounced through Clerk login. Overall verdict: solid foundation, but the PRD currently overstates completeness — the cheapest correct path is to align the PRD's status columns with reality and close the two real OAuth lifecycle gaps.

## 2. Prioritized Findings

| ID | P | Title | Area | One-line recommendation |
|----|----|-------|------|------------------------|
| F1 | P1 | OAuth `authorize` loses PKCE state after Clerk login | web-pages | Forward `redirect_url` query param into `<SignIn redirectUrl=…>` |
| F2 | P1 | Refresh token not rotated on use | web-oauth | Delete consumed refresh token, issue + return a new one |
| F3 | P1 | Connected Apps revocation absent but marked Implemented | web-pages | Add `/api/oauth/revoke` + revoke button, or move PRD claim to Planned |
| F4 | P1 | CI mutates+restores `wrangler.jsonc` around build | infra | Use a separate deploy config via `--config` |
| F5 | P2 | Workflow body is a no-op duplicate logger | webhook | Replace durable Workflow with KV dedup until real automation exists |
| F6 | P2 | Wildcard-only routing table makes 3-tier machinery dead | webhook | Inline the wildcard, or mark PRD entry "In Progress" |
| F7 | P2 | Gateway "test connection" button claimed, absent | web-pages | Add `/api/gateway/test`, or drop the PRD claim |
| F8 | P2 | Token endpoint JSON branch is dead + spec-noncompliant | web-oauth | Remove the `application/json` branch |
| F9 | P2 | Dashboard greeting leaks raw Clerk userId | web-pages | Remove greeting or use Clerk `UserButton` |
| F10 | P2 | `BaseLayout` `auth` prop over-engineered, breaks landing nav | web-pages | Call `auth()` unconditionally, drop the prop |
| F11 | P2 | Dead `computedHex` in `verifySignature` | webhook | Delete lines 146-148 + 167 |
| F12 | P2 | Webhook custom domain claimed but not in `wrangler.jsonc` | infra | Add `routes`/`custom_domain` or document dashboard config |
| F13 | P2 | App READMEs use `bun`, monorepo enforces `pnpm` | infra | Replace `bun` with `pnpm` throughout |
| F14 | P3 | `code_challenge_method` forwarded then silently dropped | web-oauth | Remove the dead hidden input |
| F15 | P3 | `grant:` KV value is the token, PRD says `tokenId` | web-pages | Fix PRD schema comment |
| F16 | P3 | Hand-written `Env` type flagged for replacement | webhook | Run `wrangler types`, import generated interface |
| F17 | P3 | `refresh:` KV prefix not abstracted in `oauth.ts` | infra | Add `storeRefreshToken`/`loadRefreshToken` helpers |

Note: F2 and the "refresh token not rotated" doc-drift finding describe the same defect from two angles (missing behavior + undocumented deviation); they are merged into F2 with both PRD citations. F3 likewise absorbs the duplicate "grant revocation UI missing" finding. The webhook-URL drift appears as one item (F12) covering all three contradicting sources.

## 3. Detailed Findings

### P1 — Fix first

#### F1 — OAuth `authorize` loses PKCE state after Clerk login
`apps/web/src/pages/api/oauth/token.ts` and the authorize flow build a login redirect carrying the full OAuth state, but Clerk never receives it.

`authorize.ts:39-41`:
```ts
const loginUrl = new URL('/login', url.origin);
loginUrl.searchParams.set('redirect_url', request.url);
return redirect(loginUrl.toString(), 302);
```
`login.astro` renders `<SignIn />` with **no** `redirectUrl`/`afterSignInUrl` prop wired from the query string. Verification confirmed the Clerk Astro bundle has zero `redirect_url`/`redirectUrl` forwarding, so the `code_challenge`, `client_id`, `redirect_uri`, and `state` embedded in `redirect_url` are discarded after sign-in. An unauthenticated user starting the PKCE flow never gets an auth code — the flow breaks silently.

**Action:** in `login.astro`, read `Astro.url.searchParams.get('redirect_url')` and pass it as `<SignIn redirectUrl={…} />` (or `afterSignInUrl`). This is the load-bearing fix for the native-app login path.

#### F2 — Refresh token not rotated on use (and PRD undocuments the deviation)
PRD security model lists rotation as shipped — `PRD.md:783` *"Token exposure | Short-lived + rotation | 30-day TTL, refresh token rotation, revocation from dashboard"* and `PRD.md:469` *"Access token rotation — 30-day TTL with refresh token rotation"*.

`token.ts:72-93`, the `refresh_token` grant:
```ts
const raw = await kv.get(`refresh:${refreshToken}`);
// ... issues newAccessToken via storeToken ...
return json({ access_token: newAccessToken, token_type: 'Bearer', ... });
// old refresh:${refreshToken} key is NEVER deleted; no new refresh token issued
```
The consumed refresh token stays valid for its full 30-day TTL and is reusable indefinitely. `apps/web/README.md:180` even documents this: *"without a new refresh_token (the original stays valid)"* — so the deviation is intentional in code but contradicted by the PRD.

**Action:** implement true rotation — delete `refresh:${refreshToken}`, mint a new refresh token, store it, and return it in the response. (If rotation is deliberately out of scope, instead amend `PRD.md:469` and `:783` to say "no refresh-token rotation" so the security posture is honest. Implementing is preferred given it is listed as a security mitigation.)

#### F3 — Connected Apps revocation absent but marked Implemented
`PRD.md:708` marks the dashboard ✅ Implemented; `PRD.md:574` lists *"One-click revocation"*; yet `PRD.md:735` lists *"Token grant revocation UI"* as **P1 Planned** — the PRD contradicts itself. `dashboard.astro:33-46` renders grants read-only:
```astro
{grants.map((g) => (
  <li class="grant-item">
    <span class="dot" />
    <span>MinhAgent.app — token {g.slice(0, 8)}…</span>
  </li>
))}
```
No revoke button, no form, and no `/api/oauth/revoke` route exists anywhere under `apps/web/src/pages/api/`. Worse, `consent.astro:51` promises users: *"You can revoke this access at any time from your Dashboard."* — a promise the code cannot keep.

**Action:** add a `POST /api/oauth/revoke` that deletes `grant:{userId}:{tokenId}`, `token:{at_…}`, and `refresh:{rt_…}` keys, plus a per-grant revoke button. Until then, remove the Implemented claim and the consent-screen copy. Prefer implementing — three separate sources assert this exists.

#### F4 — CI mutates and restores `wrangler.jsonc` around the build
`.github/workflows/deploy.yml:34-36, 51-52`:
```
sed -i '/"main":/d' wrangler.jsonc
pnpm run build
...
git checkout wrangler.jsonc
npx wrangler deploy
```
Three prior CI fix commits (`1fc8c21`, `3a9b4ca`, `4b531c7`) preceded this. `apps/web/wrangler.jsonc:5` has `"main": "./dist/_worker.js/index.js"`, which `@cloudflare/vite-plugin` validates at config-load (before `dist/` exists). The hack is brittle: if `pnpm run build` exits non-zero, the file stays mutated and `git checkout` never runs.

**Action:** keep the build config clean and pass a separate `wrangler.deploy.jsonc` (carrying `main`) to the deploy step via `--config`. Eliminates the mutate/restore cycle entirely.

### P2 — Should fix

#### F5 — Workflow body is a no-op duplicate logger
`apps/webhook/src/workflows/github-event.ts:21-43` is a single `step.do("log-event")` that `console.log`s and returns `{ logged: true }`. The same fields are already logged by `index.ts:73-85` before the workflow is created. `PRD.md:715` marks *"Cloudflare Workflows — Idempotent async processing per delivery"* ✅ Implemented; the "async processing" is a no-op. The one genuine benefit is delivery dedup (instance id = delivery GUID, `index.ts:93-95`, duplicate caught at `:97-112`) — but that does not need durable-Workflow overhead.

**Action:** until the first real automation `step.do` exists, replace the Workflow with a KV `GET`+`PUT` (24h TTL) dedup check. Removes the `workflows` binding, `GITHUB_EVENT_WORKFLOW` env, the `GitHubEventWorkflow` class export, and `github-event.ts`. (`PRD.md:727` already lists automation as 🔄 In Progress, so this is honest.)

#### F6 — Wildcard-only routing table makes the 3-tier machinery dead
`apps/webhook/src/routes.ts:16-20` has exactly one entry (`"*"`). `resolveRoute` (`:26-37`) does three lookups (`event.action`, `event`, `*`); the first two always miss, so it is effectively `return routes["*"]`. `PRD.md:714` marks *"Event routing table — Three-tier"* ✅ Implemented while `PRD.md:740` lists per-event automation as P1 Planned.

**Action:** inline the wildcard in `index.ts` (or keep a 1-line helper) and restore the table when the first specific handler lands; or mark the PRD entry "In Progress / Infrastructure".

#### F7 — Gateway "test connection" button claimed, absent
`PRD.md:580` lists *"Test connection button (validates key before saving)"* under the ✅-Implemented dashboard. `dashboard.astro:57-73` is a plain `<select>` + password `<input>` + "Save key" submit — no button, no JS, no `/api/gateway/test`. `api/gateway.ts` does `kv.put` then redirect with zero provider validation, so a bad key saves silently.

**Action:** add `POST /api/gateway/test` (cheap probe to AnyRouter/OpenRouter) with a client button, or drop the claim from the PRD Implemented section.

#### F8 — Token endpoint JSON branch is dead and spec-noncompliant
`token.ts:23-28`:
```ts
if (ct.includes('application/json')) {
  const body = await request.json();
  params = new URLSearchParams(body);
} else { ... }
```
RFC 6749 §4.1.3 mandates `application/x-www-form-urlencoded`; standard OAuth clients always send form-encoded. No caller sends JSON. `new URLSearchParams(POJO)` happens to work for string values but is undocumented usage that confuses readers.

**Action:** delete the JSON branch; accept form-encoded only.

#### F9 — Dashboard greeting leaks raw Clerk userId
`dashboard.astro:27`: `<p class="greeting">Signed in as user {userId}</p>` renders an opaque `user_2abc…` ID. Contradicts PRD UX principles (`PRD.md:362` "Visual over text", action-oriented) and duplicates the Clerk `UserButton` already in the nav.

**Action:** remove the greeting line or replace with `UserButton` / a human-readable name.

#### F10 — `BaseLayout` `auth` prop over-engineered, breaks landing nav
`BaseLayout.astro:18-19`:
```ts
const authData = auth ? await Astro.locals.auth() : null;
const signedIn = auth && authData?.userId;
```
`index.astro` passes no `auth` prop, so a signed-in user on the landing page sees only "Sign in" — never their `UserButton` or Dashboard link. `dashboard.astro:5` calls `auth()` itself and then passes `auth={true}`, double-calling. (Clerk `auth()` is middleware data, not a network call, so the prop buys nothing.)

**Action:** call `auth()` unconditionally in `BaseLayout`, derive `signedIn` from it, and delete the `auth` prop. Fixes the broken landing-page nav and removes a call site.

#### F11 — Dead `computedHex` in `verifySignature`
`apps/webhook/src/index.ts:146-148` builds a 64-char hex string that is never read; the timing-safe comparison (`:153-168`) uses `computedBytes`. `:167` is `void computedHex; // suppress unused var`.

**Action:** delete lines 146-148 and 167. No effect on correctness or security.

#### F12 — Webhook custom domain claimed but not in config
`PRD.md:602` *"Live at webhook.minhagent.dev"*, `apps/webhook/README.md:8` *"Set Webhook URL: https://webhook.minhagent.dev/webhook"*, but `CLAUDE.md:9` says `minhagent-webhook.duyet.workers.dev` — and `apps/webhook/wrangler.jsonc` (18 lines) has no `routes`/`custom_domain`. The web worker by contrast has `routes: [{pattern: "minhagent.dev", custom_domain: true}]`. Three sources, none agreeing, none enforced in deployable config. A fresh deploy would not recreate the custom domain.

**Action:** pick the canonical URL; add `routes: [{pattern: "webhook.minhagent.dev", custom_domain: true}]` to the webhook `wrangler.jsonc` (or document that it's dashboard-configured) and reconcile `CLAUDE.md`, PRD, and README.

#### F13 — App READMEs use `bun`, monorepo enforces `pnpm`
`apps/web/README.md:14,71,81` and `apps/webhook/README.md:24,52,59` use `bun install`/`bun run …`. Root `package.json` declares `"packageManager": "pnpm@10.33.3"` and all CI uses `pnpm`. `bun install` in a `pnpm` workspace with no `bun.lockb` bypasses `pnpm-workspace.yaml` and produces a different tree.

**Action:** replace `bun` with `pnpm` throughout both READMEs.

### P3 — Cleanup

#### F14 — `code_challenge_method` forwarded then dropped
`authorize.ts` validates `method === 'S256'` before consent, then `authorize.ts:49` forwards it; `consent.astro:16,46` reads + re-emits it as a hidden input; `decision.ts` never reads it. Dead 3-hop plumbing.
**Action:** remove the hidden input and the `consent.astro:16` read.

#### F15 — `grant:` KV value is the token, PRD says `tokenId`
`PRD.md:592` documents `grant:{userId}:{id} → tokenId`, but `oauth.ts:56` stores the raw access token as the value; `dashboard.astro:15` reads the tokenId from the **key** (`split(':')[2]`), never the value.
**Action:** update the PRD schema line to say the value is the raw access token (needed for `kv.delete` on revoke).

#### F16 — Hand-written `Env` type flagged for replacement
`apps/webhook/src/types.ts:1-16` self-documents as bootstrap code to be replaced by `wrangler types`; `worker-configuration.d.ts` does not exist yet. `package.json` already has `"types": "wrangler types"`.
**Action:** run `pnpm run types`, import the generated `Env`, keep only `GitHubEventParams` in `types.ts`.

#### F17 — `refresh:` KV prefix not abstracted
`oauth.ts` centralizes `code:` and `token:` key construction in helpers, but `token.ts:57-61,74` builds `refresh:${…}` inline, bypassing the lib. PRD lists `refresh:{rt_xxx}` as a first-class key (`PRD.md:593`).
**Action:** add `storeRefreshToken`/`loadAndDeleteRefreshToken` to `oauth.ts` (this also sets up the F2 rotation fix cleanly).

## 4. Simplification Wins (ranked by impact)

| Rank | Change | Files | Est. LOC removed |
|------|--------|-------|------------------|
| 1 | Remove no-op Workflow; replace with KV dedup (F5) | delete `github-event.ts` (43 LOC) + `workflows` binding in `wrangler.jsonc` + `GitHubEventWorkflow` export + `GITHUB_EVENT_WORKFLOW` env; add ~6 LOC KV check | **~−45 net** |
| 2 | Collapse wildcard-only routing into an inline check (F6) | `routes.ts` (37 LOC) → ~3 LOC in `index.ts` | **~−34** |
| 3 | Drop `BaseLayout` `auth` prop, call `auth()` unconditionally (F10) | `BaseLayout.astro`, `dashboard.astro`, `index.astro` | **~−6** (and a removed double-call + a real bug fix) |
| 4 | Delete token endpoint JSON branch (F8) | `token.ts:23-28` | **~−4** |
| 5 | Delete dead `computedHex` (F11) | `index.ts:146-148, 167` | **−4** |
| 6 | Remove `code_challenge_method` plumbing (F14) | `authorize.ts:49`, `consent.astro:16,46` | **−3** |
| 7 | Replace hand-written `Env` with generated type (F16) | `types.ts:1-16` | **~−9** (one command) |
| 8 | Remove `dashboard.astro` greeting (F9) | `dashboard.astro:27` | **−1** (+ removes ID leak) |

Total realistic deletion: **~110 LOC** plus one wrangler binding and one durable-execution dependency, with two of these (F10, F11) also fixing real defects. Ranks 1, 2, 7 are the highest leverage — they remove whole files/abstractions, not lines.

## 5. PRD Updates Needed

These are places the PRD itself is wrong about reality and should change even if no code is touched:

1. **`PRD.md:469` & `:783` — refresh-token rotation.** Either ship rotation (F2) or strike "refresh token rotation" from both security-model rows. Today the PRD overstates the token-exposure mitigation.
2. **`PRD.md:708` vs `:735` — revocation contradiction.** The dashboard cannot be both ✅ Implemented (with "One-click revocation", `:574`) and have "Token grant revocation UI" in Planned (`:735`). Move the revocation capability to Planned until F3 ships, and remove the `consent.astro:51` promise meanwhile.
3. **`PRD.md:580` — gateway test-connection button.** Move out of the Implemented dashboard description until F7 ships; the form has no validation today.
4. **`PRD.md:714` — "Event routing table: Three-tier" Implemented.** Reword to "In Progress / Infrastructure"; only the wildcard tier is reachable (F6).
5. **`PRD.md:715` — "Cloudflare Workflows: Idempotent async processing" Implemented.** Accurate only for idempotency; "async processing" is a no-op (F5). Reword to reflect that automation steps are pending.
6. **`PRD.md:592` — `grant:` KV schema.** Value is the raw access token, not `tokenId` (F15). Fix the schema line.
7. **`PRD.md:602` + `apps/webhook/README.md:8` + `CLAUDE.md:9` — webhook URL.** Reconcile to one canonical address and ensure it is wired in `wrangler.jsonc` (F12). Until the custom domain is provisioned, the "Live at webhook.minhagent.dev" status is unverifiable.

---

*8 candidate findings were refuted during verification and are excluded. The OAuth PKCE core (S256, one-time 5-minute auth codes, HMAC-SHA256 webhook verification) is correctly implemented and matches the PRD — the gaps above are at the edges of the lifecycle, not the cryptographic core.*
