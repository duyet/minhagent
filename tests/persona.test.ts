import assert from "node:assert/strict"
import { test } from "node:test"
import { buildMinhSystemPrompt } from "../lib/persona.ts"

test("system prompt is Pi-style: identity, tools, MCP, guidelines", () => {
  const prompt = buildMinhSystemPrompt([
    "execute_snippet",
    "mcp_list_tools",
    "mcp_call",
    "unknown_not_listed",
  ])
  assert.match(prompt, /^You are Minh, an expert coding agent/)
  assert.match(prompt, /Available tools:/)
  assert.match(prompt, /- execute_snippet:/)
  assert.match(prompt, /- mcp_list_tools:/)
  assert.match(prompt, /- mcp_call:/)
  assert.doesNotMatch(prompt, /unknown_not_listed/)
  assert.match(prompt, /MCP \(Model Context Protocol\)/)
  assert.match(prompt, /mcp\.duyet\.net\/mcp/)
  assert.match(prompt, /anyrouter\.dev\/api\/v1\/mcp/)
  assert.match(prompt, /Guidelines:/)
  assert.match(prompt, /Never call yourself a chatbot template/)
  assert.doesNotMatch(prompt, /chatbot template built/)
})

test("empty tool list still states Minh and MCP", () => {
  const prompt = buildMinhSystemPrompt([])
  assert.match(prompt, /You are Minh/)
  assert.match(prompt, /\(none\)/)
  assert.match(prompt, /mcp_list_tools and mcp_call/)
})
