import { MinhAgent, type MinhEnv } from "./agent.js";

export { MinhAgent };

function sessionId(req: Request): string {
  const url = new URL(req.url);
  return url.searchParams.get("session") ?? req.headers.get("x-session") ?? "default";
}

export default {
  async fetch(request: Request, env: MinhEnv): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({ ok: true, agent: "Minh" });
    }

    if (url.pathname === "/api/chat" && request.method === "POST") {
      let body: { message?: string; messages?: Array<{ role?: string; content?: string }> };
      try {
        body = (await request.json()) as typeof body;
      } catch {
        return Response.json({ error: "Invalid JSON" }, { status: 400 });
      }

      const last =
        body.message ??
        [...(body.messages ?? [])]
          .reverse()
          .find((m) => m.role === "user")?.content ??
        "";
      if (!last.trim()) {
        return Response.json({ error: "message required" }, { status: 400 });
      }

      try {
        const id = env.MINH.idFromName(sessionId(request));
        const stub = env.MINH.get(id);
        return stub.fetch(
          new Request("https://minh/chat", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ message: last.trim() }),
          }),
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return Response.json({ agent: "Minh", error: message }, { status: 500 });
      }
    }

    return env.ASSETS.fetch(request);
  },
};
