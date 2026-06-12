# PRD — MinhAgent

> **AI that works for you, on every device.**

---

## Table of Contents

1. [Vision](#vision)
2. [Problem Statement](#problem-statement)
3. [Product Architecture](#product-architecture)
4. [Core Value: Why AnyRouter](#core-value-why-anyrouter)
5. [Product 1: MinhAgent.app](#product-1-minhagentapp)
6. [Product 2: minhagent.dev (Web Platform)](#product-2-minhagentdev-web-platform)
7. [Product 3: Webhook Worker](#product-3-webhook-worker-github-integration)
8. [User Personas](#user-personas)
9. [UX/UI Design Principles](#uxui-design-principles)
10. [Feature Matrix](#feature-matrix)
11. [Technical Stack](#technical-stack)
12. [Security Model](#security-model)
13. [Pricing & Monetization](#pricing--monetization)
14. [Roadmap](#roadmap)
15. [Success Metrics](#success-metrics)
16. [Risk Analysis](#risk-analysis)

---

## Vision

MinhAgent makes AI agent capabilities accessible to **everyone** — not just developers. Through a native Mac/iOS app, users get autonomous GitHub automation, intelligent LLM routing, and deep OS integration without writing code, managing API keys, or understanding provider differences.

The foundation is **AnyRouter**: a unified LLM gateway that replaces fragmented provider APIs with **one endpoint, one key, every model**. MinhAgent leverages this to give non-technical users the same power that developers get from direct API access.

### Mission

Eliminate the gap between AI capability and AI accessibility. Every person who can use an iPhone should be able to leverage the best AI models in the world — without knowing what a model is, what a provider is, or what an API key is.

### The Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────┐
│          LAYER 3 — EXPERIENCE                           │
│                                                         │
│     MinhAgent.app (macOS / iOS)                         │
│     The consumer-facing product.                        │
│     Users never see API keys, models, or config.        │
│                                                         │
│     GitHub Automation · Chat Agent · OS Integration     │
└────────────────────────┬────────────────────────────────┘
                         │ OAuth 2.0 PKCE
                         │ (auto-generated short-term tokens)
                         ▼
┌─────────────────────────────────────────────────────────┐
│          LAYER 2 — PLATFORM                             │
│                                                         │
│     minhagent.dev (Web)                                 │
│     Auth · Dashboard · OAuth Provider · Gateway Manager │
│                                                         │
│     Astro 6 + Clerk + Cloudflare Workers                │
└────────────────────────┬────────────────────────────────┘
                         │ Bearer token → gateway credentials
                         ▼
┌─────────────────────────────────────────────────────────┐
│          LAYER 1 — INFRASTRUCTURE                       │
│                                                         │
│     AnyRouter (LLM Gateway)                             │
│     One API · Every Model · Smart Routing · Presets     │
│                                                         │
│     115+ models · 23 providers · MCP compatible         │
│     OpenAI-compatible · BYOK · Unified billing          │
└─────────────────────────────────────────────────────────┘
```

---

## Problem Statement

### The Fragmentation Problem

The AI landscape in 2026 is fragmented across providers, models, pricing tiers, and authentication mechanisms. This creates compounding pain for two distinct audiences:

| Pain Point | Non-Technical Users | Developers |
|---|---|---|
| Managing API keys across OpenAI, Anthropic, Google, etc. | "I just want AI to work" | 5+ billing accounts to manage |
| Choosing the right model for each task | No idea what GPT-5 vs Claude vs Gemini means | Constant benchmarking and migration |
| Paying for multiple subscriptions | Paying $20/mo × 3 services | API bills across 5+ dashboards |
| Giving AI agent apps access to LLM credentials safely | Copy-pasting keys into apps they don't trust | Building custom auth for each app |
| No native Mac/iOS experience for AI agent workflows | Stuck in browser tabs | No system-level integration |

### Why Now

1. **Model proliferation** — 100+ capable models exist; users shouldn't need to choose
2. **Agent apps emerging** — Every AI agent app needs LLM access; each one reinvents auth + routing
3. **Apple ecosystem demand** — Power users want AI in Shortcuts, Focus modes, and native apps
4. **Provider lock-in fatigue** — Users want freedom to switch models without reconfiguring everything

---

## Product Architecture

```
┌─────────────────────────────────────────────────────┐
│                    MinhAgent.app                     │
│              (macOS / iOS native app)                │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │  GitHub  │  │   Chat   │  │  OS Integrations  │  │
│  │Automation│  │  Agent   │  │ Shortcuts·Focus·  │  │
│  │          │  │          │  │ Notifications     │  │
│  └────┬─────┘  └────┬─────┘  └────────┬──────────┘  │
│       │             │                 │              │
│       └─────────┬───┘────────────────┘              │
│                 │                                   │
│        OAuth 2.0 PKCE                              │
│        (auto-generated short-term tokens)           │
└─────────────────┬───────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│               minhagent.dev (Web)                    │
│        Astro + Clerk + Cloudflare Workers            │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌───────────────────┐  │
│  │  Login   │  │ Consent  │  │    Dashboard      │  │
│  │ (Clerk)  │  │  Screen  │  │  Keys·Apps·Grants │  │
│  └──────────┘  └──────────┘  └───────────────────┘  │
│                                                      │
│  OAuth Provider  ·  Token Manager  ·  Gateway Store  │
└─────────────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────┐
│              AnyRouter (LLM Gateway)                 │
│          One API · Every Model · Smart Routing       │
│                                                      │
│  115+ models · 23 providers · Presets · BYOK         │
│  OpenAI-compatible · Anthropic-native · MCP           │
└─────────────────────────────────────────────────────┘
```

---

## Core Value: Why AnyRouter

> **AnyRouter is not a model. It's not a provider. It's the layer between every AI app and every model — making the right call, to the right provider, at the right price, every time.**

### 1. One API, Every Model

**The problem:** Every provider has its own SDK, auth mechanism, rate limits, error format, and billing dashboard. Building with multiple providers means maintaining parallel integrations that drift apart.

**The solution:** A single OpenAI-compatible endpoint that speaks to every provider.

Replace this:
```python
# Before: one client per provider, one billing account per provider
openai_client = OpenAI(api_key="sk-...")
anthropic_client = Anthropic(api_key="sk-ant-...")
google_client = GenerativeAI(api_key="AIza...")
deepseek_client = OpenAI(base_url="https://api.deepseek.com", api_key="sk-...")
```

With this:
```python
# After: one client, every model, one billing account
client = OpenAI(
    base_url="https://anyrouter.dev/api/v1",
    api_key="sk-ar-v1-...",
)

# All providers through one interface
client.chat.completions.create(model="anthropic/claude-sonnet-4.6", ...)
client.chat.completions.create(model="openai/gpt-5.4-mini", ...)
client.chat.completions.create(model="google/gemini-2.5-flash", ...)
client.chat.completions.create(model="deepseek/deepseek-r2", ...)
client.chat.completions.create(model="meta/llama-4-maverick", ...)
# 110+ more models, zero code changes
```

**Key properties:**
- **Drop-in migration:** Change `base_url` and `api_key`. Everything else stays the same.
- **Model namespace:** `provider/model` format eliminates ambiguity (e.g., `anthropic/claude-sonnet-4.6` vs `openai/gpt-5.4-mini`).
- **Unified error format:** All provider-specific errors normalized to a consistent schema.
- **115+ models, 23 providers:** OpenAI, Anthropic, Google, DeepSeek, Meta, NVIDIA, xAI, Mistral, Cohere, and more — through one integration.

### 2. Unified Subscription & Billing

**The problem:** AI users juggle 3–5 provider billing accounts, each with different pricing, different billing cycles, and different credit expiration policies. Enterprise users need procurement approval for each new provider.

**The solution:** One balance, every provider, transparent markup.

- **Prepaid credits** — Load one balance; tokens are deducted per-request at each provider's cost plus a transparent margin.
- **BYOK mode** — Attach your own provider keys for **zero markup**. You pay the provider directly; AnyRouter just routes.
- **One invoice** — No more reconciling 5+ provider bills.
- **Credit pooling** — Teams and organizations share a single credit pool.
- **Budget controls** — Per-key and per-preset spending caps prevent runaway costs.
- **No lock-in** — Export your usage data, swap providers, or switch to BYOK at any time.

```
┌──────────────────────────────────────────┐
│          One Billing Dashboard           │
│                                          │
│  Credits: $47.82                         │
│                                          │
│  Today's usage:                          │
│  ├── Anthropic Claude  $1.24 (5.2k req) │
│  ├── OpenAI GPT-5      $0.87 (3.1k req) │
│  ├── Google Gemini     $0.31 (1.8k req) │
│  └── DeepSeek          $0.08 (4.2k req) │
│                                          │
│  Total: $2.50                            │
│  Margin: $0.15 (6%)                      │
└──────────────────────────────────────────┘
```

### 3. Intelligent Routing

**The problem:** Every AI request should go to the best model for the task, at the best price, with the lowest latency. But routing logic is complex, provider-specific, and changes constantly as models and pricing update.

**The solution:** A request-level routing engine that considers cost, latency, health, and user preference — configurable per-request via headers or presets.

#### Routing Strategies

| Strategy | How It Works | When to Use |
|---|---|---|
| **Deterministic priority** | Default fallback order per model family | Default — predictable behavior |
| **Cost-aware** (`sort: "price"`) | Routes to cheapest healthy provider | High-volume, cost-sensitive workloads |
| **Latency-aware** (`sort: "latency"`) | Routes to fastest healthy provider | Interactive chat, real-time agents |
| **Budget-capped** | `max_price.prompt` / `max_price.completion` limits | Preventing cost overruns |
| **Provider pinning** | `X-AnyRouter-Provider: <id>` forces specific upstream | Compliance, data residency, SLA requirements |
| **Auto-failover** | Unhealthy candidates cool down; next candidate takes over | Always on — transparent resilience |
| **Request-level steering** | `only`, `ignore`, `order` per-request overrides | A/B testing, gradual migrations |

#### How Routing Works

```
Incoming Request
       │
       ▼
┌──────────────┐
│ Parse Model  │  "anthropic/claude-sonnet-4.6"
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Resolve      │  Which providers offer this model?
│ Candidates   │  → anthropic (direct), aws-bedrock, gcp-vertex
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Apply Rules  │  Routing strategy + user preferences
│              │  → Cost-aware? Latency-aware? Pinned?
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Health Check │  Is the candidate healthy? (cooldown tracking)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Route        │  Send to best candidate
│              │  → Track latency, tokens, errors
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Failover     │  If candidate fails → next candidate
│              │  → Cool down failed candidate
└──────────────┘
```

**Failover in action:** A request for `anthropic/claude-sonnet-4.6` first tries the direct Anthropic API. If it returns 503, the router automatically retries on AWS Bedrock's Claude endpoint — same model, different provider, zero code changes.

### 4. Presets — Reusable Configuration Bundles

**The problem:** Every agent needs consistent model selection, system prompts, sampling parameters, and routing rules. Hardcoding these means every agent duplicates configuration, and changing behavior requires updating every call site.

**The solution:** Presets — named, reusable configuration bundles that encapsulate model, routing, and generation settings.

```json
// Preset: @preset/hermes-agent
{
  "model": "anthropic/claude-sonnet-4.6",
  "system_prompt": "You are a helpful coding assistant...",
  "temperature": 0.7,
  "max_tokens": 4096,
  "routing": {
    "sort": "latency",
    "fallback": ["openai/gpt-5.4-mini", "google/gemini-2.5-flash"]
  },
  "budget": {
    "max_price": { "prompt": 0.01, "completion": 0.03 }
  }
}
```

**Usage:**

```bash
# Reference a preset instead of configuring everything
POST /chat/completions
{ "model": "@preset/hermes-agent", "messages": [...] }

# Override model while keeping preset settings
POST /chat/completions
{ "model": "openai/gpt-5.4-mini@preset/hermes-agent", "messages": [...] }
```

**Preset capabilities:**
- **System prompts** — Bundle the agent personality with the model config
- **Sampling parameters** — Temperature, top_p, max_tokens, stop sequences
- **Routing rules** — Sort strategy, fallback chains, provider pinning
- **Budget controls** — Per-prompt and per-completion price caps
- **BYOK routing** — Pin specific models to your own provider keys
- **Model override** — Use preset settings with a different model (`model@preset` syntax)
- **Shareable** — Presets can be shared across team members and apps

### 5. Dynamic Model Settings

**The problem:** Model configurations are static — hardcoded in app builds or config files. When a new model drops (e.g., Claude Opus 4.8), every app needs a code update. When pricing changes, every app needs a config update.

**The solution:** Dynamic model configuration managed at the gateway layer.

- **Model catalog API** — Always-up-to-date list of available models, capabilities, context windows, and pricing. Apps query this at runtime instead of hardcoding.
- **Capability-aware routing** — Automatically select models based on requirements: "I need vision" → routes to a vision-capable model. "I need a 200K context window" → filters to models with sufficient context.
- **Price updates in real-time** — When a provider changes pricing, routing adjusts instantly. No app updates needed.
- **New model day-one access** — When a new model appears in a provider's API, it's immediately available through the gateway. No SDK updates, no code changes.
- **Per-preset model swap** — Change the model behind a preset without touching any client code. Agents that reference `@preset/hermes-agent` automatically get the new model.

```python
# App code never changes — the preset handles model selection
response = client.chat.completions.create(
    model="@preset/hermes-agent",  # Admin swaps model behind this preset
    messages=[...]
)
```

### 6. Speed — Edge-First Architecture

**The problem:** Most AI gateways add latency by routing through a central data center. For interactive chat and real-time agents, every millisecond matters.

**The solution:** Cloudflare edge deployment with smart connection management.

- **Edge routing** — Request routing runs on Cloudflare Workers at 300+ global PoPs. Routing decisions happen in <5ms at the nearest edge node.
- **Streaming-first** — All responses stream via SSE. First token arrives as fast as the upstream provider can generate it — no buffering delay.
- **Connection pooling** — Persistent HTTP/2 connections to upstream providers reduce TLS handshake overhead.
- **Zero cold starts** — Workers are always warm. No container spin-up, no Lambda cold start penalty.
- **Streaming passthrough** — The gateway streams provider responses directly to clients without buffering the full response. Latency is dominated by the upstream provider, not the gateway.

```
User in Tokyo ──→ Cloudflare Edge (Tokyo) ──→ Anthropic API (us-west)
                    │
                    │ Routing decision: <5ms
                    │ TLS to Anthropic: pooled
                    │ First token: streamed directly
                    │
                    └──→ Total added latency: ~10-20ms
```

### 7. Friendly Dashboard & Easy UI/UX

**The problem:** AI infrastructure tools are built for developers. API key management pages are text-heavy, intimidating, and assume the user knows what a model endpoint is.

**The solution:** A dashboard designed for the "download and go" user — clean, guided, and opinionated.

#### Dashboard Design Principles

1. **Zero-config by default** — The default state should work. Users shouldn't need to touch settings.
2. **Progressive disclosure** — Show simple options first. Advanced settings behind "Advanced" toggles.
3. **Visual over text** — Usage charts, model comparison cards, color-coded status. Not tables of numbers.
4. **Action-oriented** — Every screen answers "what do I do here?" with a clear primary action.
5. **Mobile-first** — The dashboard works beautifully on iPhone. Many users will never open it on desktop.

#### Dashboard Sections

| Section | What Users See | What They Can Do |
|---|---|---|
| **Overview** | Credit balance, usage graph, active apps | Top up credits, see recent activity |
| **Connected Apps** | List of apps with OAuth grants | Revoke access, see last used date |
| **Gateway Settings** | Current provider (masked key), model preferences | Change provider, update API key |
| **Usage Analytics** | Per-model cost breakdown, request volume | Filter by date, model, app |
| **API Keys** | Key name, prefix, last used, usage totals | Create new key, set rate limits, revoke |

### 8. "Login with AnyRouter" — OAuth for AI Apps

> **This is the foundational pattern that enables any AI agent app to authenticate users and obtain LLM credentials without ever touching raw API keys.**

**The problem for AI app developers:** Every AI agent app needs LLM access. Today, developers either:
1. Hardcode their own API key (security risk, no per-user billing)
2. Ask users to paste their API key into the app (terrible UX, key visible in clipboard)
3. Build a custom auth + key management system (weeks of work, high maintenance)

**The problem for users:** Every AI app asks you to "enter your OpenAI API key." Most people don't have one, don't know how to get one, and shouldn't need to trust every app with their key.

**The solution:** OAuth 2.0 PKCE flow — the same pattern that lets you "Sign in with Google" or "Log in with GitHub" — but for AI credentials.

#### How It Works

```
┌─────────────┐                          ┌──────────────┐         ┌─────────────┐
│ MinhAgent   │                          │ minhagent.dev│         │   Clerk     │
│ (any AI     │                          │ (OAuth       │         │ (Identity)  │
│  agent app) │                          │  provider)   │         │             │
└──────┬──────┘                          └──────┬───────┘         └──────┬──────┘
       │                                        │                        │
       │ 1. Open browser with PKCE challenge    │                        │
       │ ─────────────────────────────────────> │                        │
       │                                        │                        │
       │                                        │ 2. Not signed in?      │
       │                                        │ ──────────────────────>│
       │                                        │                        │
       │                                        │ 3. User signs in       │
       │                                        │ <──────────────────────│
       │                                        │                        │
       │                                        │ 4. Show consent:       │
       │                                        │ "MinhAgent.app wants   │
       │                                        │  to access your AI     │
       │                                        │  gateway credentials"  │
       │                                        │                        │
       │                                        │ 5. User taps "Allow"   │
       │ <───────────────────────────────────── │                        │
       │    Redirect: minhagent://oauth/        │                        │
       │    callback?code=abc123                │                        │
       │                                        │                        │
       │ 6. Exchange code + PKCE verifier       │                        │
       │ ─────────────────────────────────────> │                        │
       │                                        │                        │
       │ <────────────────────────────────────── │                        │
       │    { access_token, refresh_token }     │                        │
       │                                        │                        │
       │ 7. GET /api/me/anyrouter               │                        │
       │    Authorization: Bearer at_xxx        │                        │
       │ ─────────────────────────────────────> │                        │
       │                                        │                        │
       │ <────────────────────────────────────── │                        │
       │    { provider: "anyrouter",             │                        │
       │      apiKey: "sk-ar-v1-..." }           │                        │
       │                                        │                        │
       │ 8. Use apiKey with LLM gateway          │                        │
       │ ──────────────────────>                │                        │
       │                                        │                        │
```

#### What the user experiences

1. Download MinhAgent.app from the App Store
2. Tap "Sign in with MinhAgent"
3. Browser opens → sign in with email/Google/GitHub (Clerk handles this)
4. See consent screen: "MinhAgent.app wants to access your AI gateway"
5. Tap "Allow"
6. Done. The app now has AI access. The entire flow takes <30 seconds.

**The user never sees an API key. They never copy-paste anything. They never configure a provider.**

#### What the developer gets

1. **Standard OAuth 2.0 PKCE** — No custom auth to build. Every platform has PKCE libraries.
2. **Short-term tokens** — Access tokens expire; refresh tokens rotate. If a token leaks, damage is time-bounded.
3. **Scoped access** — Tokens are scoped (`profile:read`, `anyrouter:read`). Apps only get what they need.
4. **Revocable** — Users revoke access from the dashboard at any time. No waiting for token expiry.
5. **Per-user billing** — Each user's LLM usage is billed to their own gateway credits. The app developer doesn't pay for user AI calls.

#### Security Properties

| Property | Implementation |
|---|---|
| PKCE (S256) | No client secret in the native app binary. Code challenge prevents auth code interception. |
| Short-lived auth codes | 5-minute TTL, one-time use (delete-on-read). Even if intercepted, the code is useless after one exchange. |
| Access token rotation | 30-day TTL with refresh token support. Compromised tokens can be revoked from the dashboard. |
| Consent screen | Explicit Allow/Deny with human-readable scope labels. User knows exactly what access they're granting. |
| No credential exposure | The native app never sees the user's Clerk credentials (login happens in the system browser). |
| Idempotent grants | Grant records stored in KV for audit and revocation. Dashboard shows all active grants. |

#### This Pattern Generalizes

MinhAgent is the first app to use this pattern, but the architecture is generic:

```
Any AI agent app can:
1. Register an OAuth client (client_id, redirect_uri)
2. Implement PKCE flow (standard libraries on every platform)
3. Receive scoped, short-lived tokens
4. Call /api/me/anyrouter to get LLM credentials
5. Make LLM calls through the user's gateway

Zero custom auth code. Zero key management. Zero trust issues.
```

This makes **AnyRouter the OAuth provider for AI** — the same way Google is the OAuth provider for "Sign in with Google" across millions of apps.

### 9. MCP (Model Context Protocol) Compatibility

AnyRouter speaks the Model Context Protocol, enabling direct integration with AI coding tools (Claude Code, Cursor, Windsurf, etc.) and MCP-compatible agent frameworks.

- **Drop-in MCP server** — Point your tool at `https://anyrouter.dev/mcp` with your API key
- **Tool discovery** — Models, routing, presets, and usage all exposed as MCP tools
- **Streaming support** — MCP streaming for real-time agent workflows

---

## Product 1: MinhAgent.app

**Status:** In development | **Platform:** macOS + iOS | **Stack:** Swift/SwiftUI

The native app is the consumer-facing product. Users never see API keys, model selection, or provider configuration.

### Core Value Proposition

> **Download → Sign in → AI works. That's it.**

### Key Features

#### Authentication
- **One-tap login** — Sign in with MinhAgent account (backed by Clerk). Supports email, Google, GitHub.
- **Zero-config AI** — The app silently obtains a short-lived API token via OAuth PKCE and retrieves gateway credentials from minhagent.dev.
- **Biometric unlock** — Face ID / Touch ID for app access. Tokens stored in iOS Keychain / macOS Keychain.

#### GitHub Automation
- **Issue triage** — Auto-label, auto-assign, suggest priority based on content analysis
- **PR review assistance** — Summarize diffs, suggest improvements, catch common issues
- **Change summarization** — "What changed since last release?" in plain English
- **CI monitoring** — Track build status, notify on failures, suggest fixes

#### Chat Agent
- **General-purpose AI assistant** — Uses your LLM gateway with intelligent model routing
- **Context-aware** — Integrates with GitHub repos, local files, and system context
- **Multi-turn conversations** — Persistent chat history with model memory
- **Model selection** — Automatically picks the best model for the task (reasoning → Opus, speed → Haiku, code → Sonnet)

#### Deep OS Integration
- **Shortcuts** — "Summarize this PR", "Review my issues", "Draft a response" as system-level actions
- **Focus modes** — Filter GitHub notifications by priority during work/personal time
- **Push notifications** — Intelligent filtering: only for what matters (PR reviews, critical issues, CI failures)
- **Share Sheet** — Share text/files to MinhAgent from any app
- **Widget** — Quick AI access from home screen / desktop

#### Multi-Model Access
- **115+ models** through one subscription — GPT-5, Claude, Gemini, DeepSeek, Llama, and more
- **Intelligent routing** — The app uses presets to pick the right model for each task
- **Dynamic model list** — New models appear automatically, no app update needed
- **Model comparison** — "Try this with Claude vs GPT" for curious users

---

## Product 2: minhagent.dev (Web Platform)

**Status:** Live at https://minhagent.dev | **Stack:** Astro 6 + Clerk + Cloudflare Workers

The web platform serves three purposes: **landing page**, **user dashboard**, and **OAuth provider** for the native app.

### Pages

| Route | Auth | Purpose |
|---|---|---|
| `/` | Public | Landing page — product overview, features, CTA |
| `/login` | Public | Clerk sign-in/sign-up widget |
| `/dashboard` | Required | Authenticated — manage gateway keys, view connected apps, profile settings |
| `/consent` | Required | OAuth consent screen (shown when native app requests access) |

### API Endpoints

| Endpoint | Method | Auth | Purpose |
|---|---|---|---|
| `/api/oauth/authorize` | GET | Session | OAuth authorization — validates client, PKCE params, redirects to consent |
| `/api/oauth/decision` | POST | Session | Handles Allow/Deny from consent screen → issues auth code |
| `/api/oauth/token` | POST | — | Token exchange (authorization_code + refresh_token grants) |
| `/api/gateway` | POST | Session | Save user's LLM gateway provider + API key |
| `/api/me/anyrouter` | GET | Bearer token | Retrieve stored gateway credentials (for native app) |

### Dashboard Features

#### Connected Apps
- Lists all active OAuth grants with green status dot
- Shows app name, grant date, last used, token ID (truncated)
- One-click revocation

#### LLM Gateway Configuration
- Provider selection: **AnyRouter** or **OpenRouter**
- API key input (masked display after save)
- Test connection button (validates key before saving)
- Stored in Cloudflare KV at `gateway:{userId}`

#### Profile Settings
- Links to Clerk's user profile for name/email/account management
- Account deletion via Clerk self-service

### Data Architecture

```
Cloudflare KV (OAUTH_KV namespace)
├── code:{uuid}          → CodeRecord     (5 min TTL, one-time use)
├── token:{at_xxx}       → TokenRecord    (30 day TTL)
├── grant:{userId}:{id}  → tokenId        (revocation lookup)
├── refresh:{rt_xxx}     → TokenRecord    (30 day TTL)
└── gateway:{userId}     → { provider, apiKey }
```

---

## Product 3: Webhook Worker (GitHub Integration)

**Status:** Live at webhook.minhagent.dev | **Stack:** Hono 4 + Cloudflare Workflows

Receives GitHub App webhooks, verifies HMAC-SHA256 signatures, and routes events to Cloudflare Workflows for async processing.

### Current Capabilities

- **HMAC-SHA256 verification** — Every webhook validated against `GITHUB_WEBHOOK_SECRET`
- **Timing-safe comparison** — Constant-time signature check prevents timing attacks
- **Structured logging** — All events logged with delivery ID, event type, action, repo, sender
- **Three-tier routing** — `event.action` → `event` → `*` (exact → general → wildcard)
- **Cloudflare Workflows** — Each delivery creates an idempotent workflow instance (delivery GUID = instance ID)
- **Fast response** — Returns 202 immediately; processing is fully asynchronous
- **Idempotent** — Duplicate deliveries (same GUID) are silently ignored

### Planned Automation

| Automation | Trigger | Action |
|---|---|---|
| Issue triage | `issues.opened` | Auto-label, auto-assign, analyze priority, suggest response |
| PR review | `pull_request.opened` | Summarize diff, flag issues, suggest improvements |
| CI monitoring | `check_run.completed` | Notify on failure, suggest fixes, link relevant logs |
| Release management | `release.created` | Draft release notes, generate changelog from commits |
| Stale management | Scheduled | Close stale issues/PRs, remind assignees |

---

## User Personas

### Primary: Non-Technical Knowledge Worker

- **Profile:** Uses AI tools but doesn't write code. Manages GitHub repos (project manager, designer, startup founder). Pays for ChatGPT/Claude but doesn't know which model to use when.
- **Pain:** "I just want AI to help me manage my project, not make me configure things."
- **MinhAgent delivers:** Download app → sign in → done. No API keys, no model selection, no config files. AI that just works.

### Secondary: Developer Building AI Apps

- **Profile:** Building agent apps that need LLM access. Wants one API for all providers with smart routing. Needs programmatic key generation for end users.
- **Pain:** "I don't want to build auth, key management, and routing for every AI app I make."
- **AnyRouter delivers:** Swap base URL + key → every model works. OAuth flow for user key generation. Presets for prompt/model bundles. Drop-in replacement for OpenAI SDK.

### Tertiary: Cost-Conscious Power User

- **Profile:** Uses AI tools daily across multiple services. Pays $20/mo × 3 subscriptions. Wants the best model for each task without overpaying.
- **Pain:** "I'm paying for ChatGPT Pro, Claude Pro, and Gemini Advanced but only use each for specific things."
- **MinhAgent + AnyRouter delivers:** One subscription, every model. Intelligent routing picks the right model and the cheapest provider automatically.

---

## UX/UI Design Principles

### 1. Zero-Config by Default

The default state must work. A user who signs in and does nothing else should have a working AI experience.

**Implementation:**
- Free-tier credits pre-loaded on signup
- Default preset selects a fast, capable model
- No required settings screens on first launch

### 2. Progressive Disclosure

Show simple options first. Advanced settings behind expandable sections.

**Implementation:**
- Dashboard shows: credit balance, connected apps, current gateway
- Advanced: model preferences, routing strategy, custom presets
- Developer: API key management, rate limits, usage breakdown

### 3. Visual Over Text

Charts, cards, and color-coded status over tables and numbers.

**Implementation:**
- Usage analytics: stacked area chart (not a table)
- Connected apps: cards with status dots (not a list)
- Gateway config: provider logo + masked key (not a text input)

### 4. Mobile-First Dashboard

Many users will only interact with the dashboard on mobile (after signing up from the native app).

**Implementation:**
- Touch-friendly targets (48px minimum)
- Responsive grid that collapses cleanly on iPhone
- Critical actions (revoke, top up) accessible without scrolling

### 5. Dark Mode Native

Light-first CSS with `prefers-color-scheme` dark mode. Not a toggle — it follows system preference.

**Implementation:**
- CSS custom properties for all colors
- `prefers-color-scheme: dark` media query
- Already implemented in BaseLayout.astro

---

## Feature Matrix

### ✅ Implemented

| Feature | Component | Details |
|---|---|---|
| Landing page | Web | minhagent.dev — hero, features, CTA |
| Clerk authentication | Web | Email, Google, GitHub sign-in |
| User dashboard | Web | Connected apps, gateway config, profile |
| OAuth 2.0 PKCE provider | Web | Full authorization code + refresh flow |
| Token management | Web | Access, refresh, grants with TTL |
| LLM gateway key storage | Web | Provider + API key in KV |
| Gateway credential API | Web | Bearer-authenticated retrieval endpoint |
| Consent screen | Web | Human-readable scope labels |
| GitHub webhook receiver | Webhook | HMAC-SHA256 verified, structured logging |
| Event routing table | Webhook | Three-tier: event.action → event → wildcard |
| Cloudflare Workflows | Webhook | Idempotent async processing per delivery |
| CI/CD pipeline | Infra | GitHub Actions → build → typecheck → deploy |
| Custom domain | Infra | minhagent.dev via Cloudflare |
| Light/dark mode | Web | System-preference CSS |
| Secret rotation | Infra | `scripts/rotate-webhook-secret.sh` |
| Responsive design | Web | Mobile-first with breakpoints |

### 🔄 In Progress

| Feature | Component | Details |
|---|---|---|
| Native macOS/iOS app | App | Swift/SwiftUI, OAuth PKCE integration |
| GitHub automation actions | Webhook | Issue triage, PR review, CI monitoring |
| Multi-provider gateway support | Web | Beyond current 2 providers |

### 📋 Planned

| Feature | Component | Priority | Details |
|---|---|---|---|
| In-app profile management | Web | P2 | Self-service name/email/account |
| Token grant revocation UI | Web | P1 | One-click revoke from dashboard |
| Shortcuts integration | App | P2 | System-level AI actions |
| Focus mode filtering | App | P3 | Filter notifications by priority |
| Push notifications | App | P2 | Intelligent: only critical events |
| Chat agent | App | P1 | Multi-turn, context-aware AI assistant |
| Per-event GitHub automation | Webhook | P1 | Issue triage, PR review, CI monitoring |
| Dynamic model settings | App | P2 | Change model/routing from native app |
| Usage analytics dashboard | Web | P2 | Per-model cost, request volume, trends |
| Team/organization support | Web + API | P3 | Shared credits, team management |
| MCP server | API | P2 | Direct tool integration for Claude Code, Cursor |
| Preset builder UI | Web | P2 | Visual preset creation and management |
| Rate limiting per key | API | P1 | Configurable rate limits on API keys |
| Credit top-up | Web | P1 | Stripe integration for credit purchase |
| Model comparison mode | App | P3 | Try same prompt across models |
| Share Sheet integration | App | P2 | Send text/files to MinhAgent from any app |
| Home screen widget | App | P3 | Quick AI access from iOS/macOS |

---

## Technical Stack

| Layer | Technology | Why |
|---|---|---|
| **Web Framework** | Astro 6 | Zero-JS-by-default, SSR for auth pages, static for landing |
| **Web Adapter** | @astrojs/cloudflare | Edge deployment, KV binding, Workers runtime |
| **Auth (Web)** | @clerk/astro | Managed auth — email, social, MFA without custom code |
| **Auth (Native)** | OAuth 2.0 PKCE | Industry standard, no client secret in app binary |
| **Webhook Framework** | Hono 4 | Lightweight, TypeScript-native, Cloudflare Workers optimized |
| **Event Processing** | Cloudflare Workflows | Durable, idempotent, async |
| **Storage** | Cloudflare KV | Globally distributed, TTL-native, free tier generous |
| **Hosting** | Cloudflare Workers | 300+ edge locations, zero cold starts, pay-per-request |
| **CI/CD** | GitHub Actions | Auto-deploy on push to main |
| **LLM Gateway** | AnyRouter | 115+ models, 23 providers, routing, presets |
| **Native App** | Swift/SwiftUI | Native performance, deep OS integration |
| **Monorepo** | pnpm workspaces | Shared tooling, atomic deploys |
| **Package Manager** | pnpm 10 | Fast, disk-efficient, strict hoisting |

---

## Security Model

### Threat Model

| Threat | Mitigation | Implementation |
|---|---|---|
| **Webhook forgery** | HMAC-SHA256 verification | Timing-safe comparison on every GitHub event |
| **OAuth token theft** | PKCE S256 | No client secret in native app; code challenge prevents interception |
| **Auth code replay** | One-time use + TTL | Delete-on-read, 5-minute expiry |
| **Token exposure** | Short-lived + rotation | 30-day TTL, refresh token rotation, revocation from dashboard |
| **Gateway key leak** | Bearer-authenticated API | Only accessible with valid OAuth access token |
| **Unauthorized access** | Explicit consent | Allow/Deny screen with human-readable scope labels |
| **Session hijacking** | Clerk managed | HTTP-only cookies, CSRF protection, secure flags |
| **Key rotation** | Scripted rotation | `scripts/rotate-webhook-secret.sh` |
| **Data persistence** | TTL-based cleanup | KV TTLs auto-expire codes and tokens |

### Data Flow Security

```
MinhAgent.app
    │
    │ OAuth PKCE (SHA-256 challenge)
    │ ← no client secret in binary
    │
    ▼
minhagent.dev
    │
    │ Clerk session cookies
    │ ← HTTP-only, Secure, SameSite
    │
    ├── Auth codes: 5 min TTL, one-time use
    ├── Access tokens: 30 day TTL, Bearer scheme
    ├── Refresh tokens: 30 day TTL, rotation
    └── Gateway keys: KV-stored, Bearer-authenticated retrieval
    
    │
    │ HTTPS only (Cloudflare TLS)
    │
    ▼
AnyRouter API
    │
    │ API key over HTTPS
    │ ← never stored in app, retrieved at runtime
    │
    ▼
Upstream LLM providers
```

---

## Pricing & Monetization

### Philosophy

- **Landing + auth = Free.** The web platform runs on Workers + KV free tier. No cost to acquire users.
- **LLM gateway = User's choice.** BYOK (bring your own key, zero markup) or prepaid credits (cost + transparent margin).
- **Native app = Subscription.** Covers LLM costs, app development, and OS integrations.
- **GitHub automation = Included.** Part of the subscription value proposition.

### Pricing Tiers

| Tier | Price | Includes |
|---|---|---|
| **Free** | $0/mo | Web dashboard, BYOK gateway, basic GitHub webhooks |
| **Pro** | $19/mo | Native app, prepaid LLM credits, full GitHub automation, Shortcuts |
| **Team** | $49/mo/seat | Everything in Pro + shared credits, team dashboard, org management |

### Credit Economics

- Credits purchased at face value ($1 = $1 in credits)
- Each LLM call deducts credits at the provider's cost + small margin
- BYOK mode: zero credits deducted (user's own provider key)
- Credits never expire while account is active

---

## Roadmap

### Phase 1 — Foundation (Current) ✅

- [x] Web platform live (minhagent.dev)
- [x] Clerk authentication
- [x] OAuth 2.0 PKCE provider
- [x] Gateway key management
- [x] GitHub webhook receiver
- [x] CI/CD pipeline
- [x] Custom domain

### Phase 2 — Native App (In Progress) 🔄

- [ ] MinhAgent.app for macOS
- [ ] MinhAgent.app for iOS
- [ ] OAuth PKCE integration in native app
- [ ] Chat agent (basic)
- [ ] GitHub issue triage automation
- [ ] PR review assistance

### Phase 3 — Intelligence (Next)

- [ ] Preset builder UI on dashboard
- [ ] Dynamic model settings from native app
- [ ] Token grant revocation UI
- [ ] Usage analytics dashboard
- [ ] Credit top-up (Stripe)
- [ ] MCP server endpoint
- [ ] Rate limiting per API key

### Phase 4 — OS Integration

- [ ] Shortcuts actions ("Summarize PR", "Review issues")
- [ ] Focus mode filtering
- [ ] Push notifications (critical events only)
- [ ] Share Sheet integration
- [ ] Home screen / desktop widget

### Phase 5 — Platform

- [ ] Third-party OAuth client registration
- [ ] Team/organization support
- [ ] Shared credit pools
- [ ] Model comparison mode
- [ ] Admin analytics dashboard
- [ ] API usage webhooks

---

## Success Metrics

### Product Metrics

| Metric | Target | Why |
|---|---|---|
| OAuth flow completion rate | > 90% | Measures friction in the critical onboarding path |
| Download to first AI response | < 60 seconds | The "magic moment" — must be instant |
| 7-day retention | > 50% | Users who experience the magic come back |
| 30-day retention | > 40% | Long-term engagement signal |
| Dashboard monthly active | > 60% of users | Healthy engagement with gateway management |

### Technical Metrics

| Metric | Target | Why |
|---|---|---|
| CI green rate | 100% | Deployment reliability |
| Webhook latency (p99) | < 500ms | GitHub integration responsiveness |
| OAuth token endpoint (p99) | < 200ms | Native app auth must be fast |
| Gateway API (p99) | < 100ms | Credential retrieval must be instant |
| Uptime | > 99.9% | Infrastructure reliability |

### Business Metrics

| Metric | Target | Why |
|---|---|---|
| Monthly LLM spend per user | > $5 | Engagement depth |
| BYOK to subscription conversion | > 20% | Revenue growth |
| Average presets per user | > 2 | Advanced feature adoption |

---

## Risk Analysis

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Cloudflare KV latency spikes | Low | Medium | KV is globally distributed; monitor p99; fallback to D1 if needed |
| Provider API deprecation | Medium | Low | Routing layer abstracts provider; swap to alternate provider |
| OAuth token volume exceeds KV limits | Low | High | KV supports 100K+ reads/sec; monitor and migrate to D1 if needed |
| Native app App Store rejection | Medium | High | Follow Apple OAuth guidelines; no embedded webviews for auth |

### Business Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Provider direct pricing undercuts | High | Medium | BYOK mode (zero markup); value is routing + presets, not price arbitrage |
| User acquisition cost too high | Medium | High | Free tier with BYOK; viral through GitHub webhook |
| Competitor launches similar gateway | Medium | Medium | First-mover in "OAuth for AI" pattern; deep OS integration as moat |
| LLM costs remain high | Medium | Medium | Cost-aware routing; BYOK option; multiple provider options |

### Security Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| OAuth token leak via app crash logs | Low | High | Tokens never logged; crash reporters configured to filter |
| KV data exposure | Very Low | Critical | KV is private by default; no public access patterns |
| Webhook secret compromise | Low | Medium | Rotation script; Cloudflare secret binding (not env var) |
| CSRF on consent screen | Very Low | Medium | POST-based decision; Clerk CSRF protection; SameSite cookies |

---

*Last updated: 2026-06-12*
