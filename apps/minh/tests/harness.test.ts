import assert from "node:assert/strict";
import { test } from "node:test";
import {
  emptySession,
  runTurn,
  type ChatMessage,
  type ModelResult,
} from "../src/harness.js";
import { memoryStore } from "./memory-store.js";

test("new session → user message → snippet tool → continue, then reload", async () => {
  const store = memoryStore(emptySession());
  let calls = 0;

  async function callModel(messages: ChatMessage[]): Promise<ModelResult> {
    calls += 1;
    const last = messages[messages.length - 1];
    if (last?.role === "user") {
      return {
        type: "tool_calls",
        toolCalls: [
          {
            id: "call_1",
            name: "execute_snippet",
            arguments: JSON.stringify({ code: "return 2+3" }),
          },
        ],
      };
    }
    if (last?.role === "tool") {
      const parsed = JSON.parse(last.content) as { result: unknown };
      return {
        type: "text",
        text: `Minh computed ${parsed.result}.`,
      };
    }
    return { type: "text", text: "Minh unexpected." };
  }

  const first = await runTurn("what is 2+3?", store, { callModel });
  assert.equal(first.text, "Minh computed 5.");
  assert.equal(first.state.lastTool, "execute_snippet");
  assert.ok(first.state.step >= 2);
  assert.ok(first.state.messages.some((m) => m.role === "tool"));

  const reloaded = await store.load();
  assert.equal(reloaded.messages.length, first.state.messages.length);
  assert.equal(reloaded.lastTool, "execute_snippet");
  const toolMsg = reloaded.messages.find((m) => m.role === "tool");
  assert.ok(toolMsg);
  assert.match(toolMsg.content, /"result":5/);

  const second = await runTurn("thanks", store, {
    callModel: async () => ({ type: "text", text: "Minh is still here." }),
  });
  const after = await store.load();
  assert.ok(after.messages.length > reloaded.messages.length);
  assert.equal(second.text, "Minh is still here.");
  assert.ok(calls >= 2);
});
