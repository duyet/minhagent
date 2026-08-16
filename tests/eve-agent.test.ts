import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { test } from "node:test"

import instructions from "../agent/instructions.ts"
import agentConfig, { MAX_STEPS } from "../agent/agent.ts"
import {
  DEFAULT_MCP_SERVER,
  DEFAULT_MCP_URL,
  MCP_CONNECTIONS,
} from "../agent/connections/index.ts"
import { agentTools } from "../agent/tools/index.ts"
import { getTools } from "../tools/index.ts"

test("instructions.md matches the bundled instructions module", () => {
  const md = readFileSync(
    resolve(import.meta.dirname, "../agent/instructions.md"),
    "utf8"
  ).trim()
  assert.equal(instructions.trim(), md)
})

test("agent/tools filename slugs are the live tool names", () => {
  assert.ok(agentTools.execute_snippet)
  assert.deepEqual(Object.keys(agentTools).sort(), [
    "ask_user",
    "execute_snippet",
    "get_time",
    "get_weather",
    "github_repo",
    "mcp_call",
    "mcp_list_tools",
    "scrape_page",
  ])
  const live = getTools("anyrouter/free")
  assert.equal(live.execute_snippet, agentTools.execute_snippet)
})

test("MCP connections come from agent/connections", () => {
  assert.equal(DEFAULT_MCP_SERVER, "duyet")
  assert.equal(DEFAULT_MCP_URL, "https://mcp.duyet.net/mcp")
  assert.equal(MCP_CONNECTIONS.duyet.url, "https://mcp.duyet.net/mcp")
  assert.equal(MCP_CONNECTIONS.duyet.auth, "none")
  assert.equal(MCP_CONNECTIONS.anyrouter.url, "https://anyrouter.dev/api/v1/mcp")
  assert.equal(MCP_CONNECTIONS.anyrouter.auth, "anyrouter")
})

test("agent.ts loop budgets are the ones createMinhAgent uses", () => {
  assert.equal(agentConfig.stopWhenSteps, MAX_STEPS)
  assert.equal(agentConfig.maxOutputTokens, 2048)
})
