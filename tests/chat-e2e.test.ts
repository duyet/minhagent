import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { test } from "node:test"

import { executeSnippet } from "../lib/snippet.ts"
import {
  consumeUiMessageResponse,
  snippetPayload,
  snippetResultIsTwo,
} from "./ui-message-stream.ts"

loadDotEnv(resolve(import.meta.dirname, "../.env.local"))

const SNIPPET_SSE = [
  'data: {"type":"start","messageId":"msg_e2e"}',
  "",
  'data: {"type":"tool-input-start","toolCallId":"call_1","toolName":"execute_snippet"}',
  "",
  'data: {"type":"tool-input-available","toolCallId":"call_1","toolName":"execute_snippet","input":{"code":"1+1"}}',
  "",
  'data: {"type":"tool-output-available","toolCallId":"call_1","output":{"result":2,"backend":"isolate"}}',
  "",
  'data: {"type":"finish"}',
  "",
  "data: [DONE]",
  "",
].join("\n")

test("stream helper rebuilds a snippet tool part from a UI-message SSE body", async () => {
  const summary = await consumeUiMessageResponse(
    new Response(SNIPPET_SSE, {
      status: 200,
      headers: { "content-type": "text/event-stream" },
    })
  )
  assert.equal(summary.status, 200)
  assert.ok(summary.toolNames.includes("execute_snippet"))
  assert.ok(snippetResultIsTwo(summary.snippetOutput))
})

test("shipped snippet executor still returns 2 for 1+1", async () => {
  const out = await executeSnippet("1+1", null)
  assert.equal(out.result, 2)
})

test("POST /api/chat rejects invalid JSON with 400", async () => {
  const { POST } = await import("../app/api/chat/route.ts")
  const res = await POST(
    new Request("http://minhagent.dev/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "not-json",
    })
  )
  assert.equal(res.status, 400)
  const body = (await res.json()) as { error?: string }
  assert.equal(body.error, "Invalid JSON body.")
})

test("POST /api/chat agent loop runs execute_snippet 1+1 twice", async (t) => {
  const url = process.env.CHAT_E2E_URL
  const hasKey = Boolean(process.env.ANYROUTER_API_KEY)
  if (!url && !hasKey) {
    t.skip(
      "No CHAT_E2E_URL or ANYROUTER_API_KEY — live loop is run from deploy e2e"
    )
    return
  }

  const first = await runAgentTurn(url)
  const second = await runAgentTurn(url)
  assertSnippetSuccess(first)
  assertSnippetSuccess(second)
})

function assertSnippetSuccess(summary: Awaited<ReturnType<typeof runAgentTurn>>) {
  assert.equal(summary.status, 200, summary.raw.slice(0, 500))
  assert.ok(
    summary.toolNames.includes("execute_snippet"),
    `tools=${summary.toolNames.join(",") || "(none)"} raw=${summary.raw.slice(0, 800)}`
  )
  assert.ok(
    snippetResultIsTwo(summary.snippetOutput),
    `snippet output=${JSON.stringify(summary.snippetOutput)} raw=${summary.raw.slice(0, 800)}`
  )
}

async function runAgentTurn(url: string | undefined) {
  const payload = snippetPayload()
  const res = url
    ? await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(60_000),
      })
    : await (await import("../app/api/chat/route.ts")).POST(
        new Request("http://minhagent.dev/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        })
      )
  return consumeUiMessageResponse(res)
}

function loadDotEnv(path: string) {
  let text: string
  try {
    text = readFileSync(path, "utf8")
  } catch {
    return
  }
  for (const line of text.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq < 1) continue
    const key = trimmed.slice(0, eq)
    let value = trimmed.slice(eq + 1)
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = value
  }
}
