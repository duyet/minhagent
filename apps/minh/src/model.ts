import type { ChatMessage, ModelResult } from "./harness.js";
import { toolDefs } from "./harness.js";

export type ModelEnv = {
  ANYROUTER_API_KEY?: string;
  AI?: {
    run: (
      model: string,
      input: unknown,
    ) => Promise<{ response?: string } | string>;
  };
};

function toOpenAIMessages(messages: ChatMessage[]) {
  return messages.map((m) => {
    if (m.role === "tool") {
      return {
        role: "tool" as const,
        content: m.content,
        tool_call_id: m.tool_call_id ?? m.name ?? "tool",
      };
    }
    if (m.tool_calls?.length) {
      return {
        role: "assistant" as const,
        content: m.content || null,
        tool_calls: m.tool_calls.map((c) => ({
          id: c.id,
          type: "function" as const,
          function: { name: c.name, arguments: c.arguments },
        })),
      };
    }
    return { role: m.role, content: m.content };
  });
}

export async function callAnyRouter(
  messages: ChatMessage[],
  apiKey: string,
): Promise<ModelResult> {
  const res = await fetch("https://anyrouter.dev/api/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
      "HTTP-Referer": "https://agent.minhagent.dev",
      "X-AnyRouter-Title": "Minh",
      "X-AnyRouter-Source": "web-app",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      messages: toOpenAIMessages(messages),
      tools: toolDefs(),
      temperature: 0.4,
      max_tokens: 120,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AnyRouter ${res.status}: ${err.slice(0, 400)}`);
  }
  const json = (await res.json()) as {
    choices?: Array<{
      message?: {
        content?: string | null;
        tool_calls?: Array<{
          id: string;
          function: { name: string; arguments: string };
        }>;
      };
    }>;
  };
  const msg = json.choices?.[0]?.message;
  if (msg?.tool_calls?.length) {
    return {
      type: "tool_calls",
      toolCalls: msg.tool_calls.map((c) => ({
        id: c.id,
        name: c.function.name,
        arguments: c.function.arguments,
      })),
    };
  }
  return { type: "text", text: (msg?.content ?? "").trim() || "Minh is here." };
}

export async function callWorkersAI(
  messages: ChatMessage[],
  ai: NonNullable<ModelEnv["AI"]>,
): Promise<ModelResult> {
  const out = await ai.run("@cf/meta/llama-3.1-8b-instruct", {
    messages: messages.map((m) => ({
      role: m.role === "tool" ? "assistant" : m.role,
      content:
        m.role === "tool" ? `[tool ${m.name}] ${m.content}` : m.content,
    })),
  });
  const text =
    typeof out === "string" ? out : (out.response ?? "").trim() || "Minh is here.";
  return { type: "text", text };
}

export async function callModel(
  messages: ChatMessage[],
  env: ModelEnv,
): Promise<ModelResult> {
  if (env.ANYROUTER_API_KEY) {
    try {
      return await callAnyRouter(messages, env.ANYROUTER_API_KEY);
    } catch {
      // AnyRouter credit/upstream failure — Workers AI stays on the Free plan.
    }
  }
  if (env.AI) {
    try {
      return await callWorkersAI(messages, env.AI);
    } catch {
      // Workers AI can be unbound or rate-limited on some accounts.
    }
  }
  return {
    type: "text",
    text: "I am Minh, a coding agent running on Cloudflare Workers. The hosted model is temporarily unavailable, but the harness and tools are live.",
  };
}
