import assert from "node:assert/strict"
import { test } from "node:test"

import {
  createAgentUIStreamResponse,
  simulateReadableStream,
} from "ai"
import { MockLanguageModelV3 } from "ai/test"

import { createMinhAgent } from "../lib/chat-agent.ts"
import { executeSnippetTool } from "../tools/snippet.ts"
import {
  consumeUiMessageResponse,
  snippetPayload,
  snippetResultIsTwo,
} from "./ui-message-stream.ts"

const emptyUsage = {
  inputTokens: {
    total: 8,
    noCache: 8,
    cacheRead: undefined,
    cacheWrite: undefined,
  },
  outputTokens: { total: 4, text: 4, reasoning: undefined },
}

function snippetThenAnswerModel() {
  let step = 0
  return new MockLanguageModelV3({
    doStream: async () => {
      step += 1
      if (step === 1) {
        return {
          stream: simulateReadableStream({
            initialDelayInMs: null,
            chunkDelayInMs: null,
            chunks: [
              { type: "stream-start", warnings: [] },
              {
                type: "tool-call",
                toolCallId: "call_snippet_1",
                toolName: "execute_snippet",
                input: JSON.stringify({ code: "1+1" }),
              },
              {
                type: "finish",
                finishReason: { unified: "tool-calls", raw: "tool_calls" },
                usage: emptyUsage,
              },
            ],
          }),
        }
      }
      return {
        stream: simulateReadableStream({
          initialDelayInMs: null,
          chunkDelayInMs: null,
          chunks: [
            { type: "stream-start", warnings: [] },
            { type: "text-start", id: "text-1" },
            { type: "text-delta", id: "text-1", delta: "2" },
            { type: "text-end", id: "text-1" },
            {
              type: "finish",
              finishReason: { unified: "stop", raw: "stop" },
              usage: emptyUsage,
            },
          ],
        }),
      }
    },
  })
}

async function runShippedLoop() {
  const tools = { execute_snippet: executeSnippetTool }
  const agent = createMinhAgent(snippetThenAnswerModel(), tools)
  const res = await createAgentUIStreamResponse({
    agent,
    uiMessages: snippetPayload().messages,
    sendSources: true,
    onError: () => "Something went wrong. Please try again.",
  })
  return consumeUiMessageResponse(res)
}

test("shipped ToolLoopAgent executes snippet 1+1 and continues twice", async () => {
  const first = await runShippedLoop()
  const second = await runShippedLoop()
  for (const [label, summary] of [
    ["first", first],
    ["second", second],
  ] as const) {
    assert.equal(summary.status, 200, `${label}: ${summary.raw.slice(0, 400)}`)
    assert.ok(
      summary.toolNames.includes("execute_snippet"),
      `${label} tools=${summary.toolNames.join(",")}`
    )
    assert.ok(
      snippetResultIsTwo(summary.snippetOutput),
      `${label} output=${JSON.stringify(summary.snippetOutput)} raw=${summary.raw.slice(0, 600)}`
    )
  }
})
