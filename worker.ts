import { POST as chat } from "./app/api/chat/route"

type Env = { ASSETS: Fetcher }

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname === "/api/chat" && request.method === "POST") {
      return chat(request)
    }
    return env.ASSETS.fetch(request)
  },
}
