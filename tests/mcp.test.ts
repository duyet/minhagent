import assert from "node:assert/strict"
import { test } from "node:test"
import {
  DEFAULT_MCP_URL,
  resolveMcpUrl,
} from "../lib/mcp.ts"

test("resolveMcpUrl maps duyet as default", () => {
  assert.equal(resolveMcpUrl(undefined).url, DEFAULT_MCP_URL)
  assert.equal(resolveMcpUrl("").url, "https://mcp.duyet.net/mcp")
  assert.equal(resolveMcpUrl("duyet").name, "duyet")
  assert.equal(resolveMcpUrl("duyet").url, "https://mcp.duyet.net/mcp")
  assert.equal(resolveMcpUrl("duyet").auth, "none")
})

test("resolveMcpUrl maps anyrouter without sending it as default", () => {
  const ar = resolveMcpUrl("anyrouter")
  assert.equal(ar.name, "anyrouter")
  assert.equal(ar.url, "https://anyrouter.dev/api/v1/mcp")
  assert.equal(ar.auth, "anyrouter")
})

test("resolveMcpUrl keeps https MCP endpoints", () => {
  assert.equal(
    resolveMcpUrl("https://example.com/mcp").url,
    "https://example.com/mcp"
  )
})

test("listMcpTools(duyet) returns github_activity from mcp.duyet.net", async () => {
  const { listMcpTools } = await import("../lib/mcp.ts")
  const out = await listMcpTools("duyet")
  assert.equal(out.url, "https://mcp.duyet.net/mcp")
  assert.ok(
    out.tools.some((t) => t.name === "github_activity"),
    `tools: ${out.tools.map((t) => t.name).join(",")}`
  )
})
