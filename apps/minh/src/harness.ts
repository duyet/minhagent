import { MINH_SYSTEM } from "./persona.js";
import { executeSnippet, type ComputerLike } from "./tools/snippet.js";
import { getTime } from "./tools/time.js";

export type ChatRole = "system" | "user" | "assistant" | "tool";

export type ChatMessage = {
  role: ChatRole;
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
};

export type ToolCall = {
  id: string;
  name: string;
  arguments: string;
};

export type SessionState = {
  messages: ChatMessage[];
  step: number;
  lastTool?: string;
};

export type ModelResult =
  | { type: "text"; text: string }
  | { type: "tool_calls"; toolCalls: ToolCall[] };

export type SessionStore = {
  load(): Promise<SessionState>;
  save(state: SessionState): Promise<void>;
};

export type HarnessDeps = {
  callModel: (messages: ChatMessage[]) => Promise<ModelResult>;
  computer?: ComputerLike | null;
};

export function emptySession(): SessionState {
  return {
    messages: [{ role: "system", content: MINH_SYSTEM }],
    step: 0,
  };
}

export function toolDefs() {
  return [
    {
      type: "function" as const,
      function: {
        name: "execute_snippet",
        description:
          "Run a small JavaScript snippet on Cloudflare Computer (or the Free-plan isolate fallback). Return the computed value.",
        parameters: {
          type: "object",
          properties: {
            code: {
              type: "string",
              description: "JavaScript expression or body, e.g. 1+1 or return 2+3",
            },
          },
          required: ["code"],
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "get_time",
        description: "Current UTC time as ISO-8601.",
        parameters: { type: "object", properties: {} },
      },
    },
  ];
}

export async function dispatchTool(
  name: string,
  rawArgs: string,
  computer?: ComputerLike | null,
): Promise<string> {
  let args: Record<string, unknown> = {};
  try {
    args = rawArgs ? (JSON.parse(rawArgs) as Record<string, unknown>) : {};
  } catch {
    args = { code: rawArgs };
  }

  if (name === "execute_snippet") {
    const code = String(args.code ?? "");
    const out = await executeSnippet(code, computer);
    return JSON.stringify(out);
  }
  if (name === "get_time") {
    return getTime();
  }
  return JSON.stringify({ error: `unknown tool ${name}` });
}

const MAX_STEPS = 5;

/** Multi-step agent loop: user message → model → tools → continue, then persist. */
export async function runTurn(
  userText: string,
  store: SessionStore,
  deps: HarnessDeps,
): Promise<{ text: string; state: SessionState }> {
  const state = await store.load();
  if (state.messages.length === 0) {
    state.messages = emptySession().messages;
  }
  state.messages.push({ role: "user", content: userText });

  let finalText = "";
  for (let i = 0; i < MAX_STEPS; i++) {
    state.step += 1;
    const result = await deps.callModel(state.messages);

    if (result.type === "text") {
      finalText = result.text;
      state.messages.push({ role: "assistant", content: result.text });
      await store.save(state);
      return { text: finalText, state };
    }

    state.messages.push({
      role: "assistant",
      content: "",
      tool_calls: result.toolCalls,
    });

    for (const call of result.toolCalls) {
      state.lastTool = call.name;
      const output = await dispatchTool(call.name, call.arguments, deps.computer);
      state.messages.push({
        role: "tool",
        name: call.name,
        tool_call_id: call.id,
        content: output,
      });
    }
    await store.save(state);
  }

  finalText = "Minh stopped after the step limit.";
  state.messages.push({ role: "assistant", content: finalText });
  await store.save(state);
  return { text: finalText, state };
}
