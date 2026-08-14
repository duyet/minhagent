import { DurableObject } from "cloudflare:workers";
import {
  emptySession,
  runTurn,
  type SessionState,
  type SessionStore,
} from "./harness.js";
import { callModel, type ModelEnv } from "./model.js";

export type MinhEnv = ModelEnv & {
  MINH: DurableObjectNamespace<MinhAgent>;
  ASSETS: Fetcher;
};

export class MinhAgent extends DurableObject<MinhEnv> {
  private store(): SessionStore {
    const sql = this.ctx.storage.sql;
    sql.exec(
      `CREATE TABLE IF NOT EXISTS session (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        payload TEXT NOT NULL
      )`,
    );
    return {
      load: async () => {
        const rows = [...sql.exec("SELECT payload FROM session WHERE id = 1")];
        const row = rows[0] as { payload?: string } | undefined;
        if (!row?.payload) return emptySession();
        return JSON.parse(String(row.payload)) as SessionState;
      },
      save: async (state) => {
        sql.exec(
          `INSERT INTO session (id, payload) VALUES (1, ?)
           ON CONFLICT(id) DO UPDATE SET payload = excluded.payload`,
          JSON.stringify(state),
        );
      },
    };
  }

  async chat(userText: string): Promise<{ text: string; state: SessionState }> {
    return runTurn(userText, this.store(), {
      callModel: (messages) => callModel(messages, this.env),
    });
  }

  async peek(): Promise<SessionState> {
    return this.store().load();
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "POST" && url.pathname === "/chat") {
      try {
        const body = (await request.json()) as { message?: string };
        const { text, state } = await this.chat(String(body.message ?? ""));
        return Response.json({
          agent: "Minh",
          text,
          step: state.step,
          lastTool: state.lastTool ?? null,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return Response.json({ agent: "Minh", error: message }, { status: 502 });
      }
    }
    return new Response("not found", { status: 404 });
  }
}
