import { createOpenAI } from "@ai-sdk/openai"

export const ANYROUTER_BASE_URL = "https://anyrouter.dev/api/v1"

// App attribution: ties requests to this app for AnyRouter's public rankings
// and per-app analytics. HTTP-Referer is the app identifier; the rest is
// display metadata. See https://anyrouter.dev/docs/features/app-attribution.md
const APP_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "https://minhagent.dev"

export const anyrouter = createOpenAI({
  baseURL: ANYROUTER_BASE_URL,
  apiKey: process.env.ANYROUTER_API_KEY,
  headers: {
    "HTTP-Referer": APP_URL,
    "X-AnyRouter-Title": "Minh",
    "X-AnyRouter-Source": "web-app",
    "X-AnyRouter-Categories": "general-chat",
  },
})
