import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { test } from "node:test"

const root = resolve(import.meta.dirname, "..")

const NAMED_TOOLS = [
  "tool-github_repo",
  "tool-ask_user",
  "tool-web_search",
  "tool-get_time",
  "tool-get_weather",
  "tool-scrape_page",
  "tool-execute_snippet",
  "tool-mcp_list_tools",
  "tool-mcp_call",
]

const PART_FILES = [
  "components/parts/ask-user-part.tsx",
  "components/parts/dynamic-tool-part.tsx",
  "components/parts/get-time-part.tsx",
  "components/parts/github-repo-part.tsx",
  "components/parts/mcp-part.tsx",
  "components/parts/scrape-part.tsx",
  "components/parts/snippet-part.tsx",
  "components/parts/weather-part.tsx",
  "components/parts/web-search-part.tsx",
]

test("ChatMessage loops parts and handles every shipped tool type", () => {
  const src = readFileSync(resolve(root, "components/chat-message.tsx"), "utf8")
  assert.match(src, /message\.parts\.map/)
  assert.match(src, /case "dynamic-tool"/)
  for (const type of NAMED_TOOLS) {
    assert.match(src, new RegExp(`case "${type}"`))
  }
})

test("every tool part renderer shows pending, result, and error", () => {
  for (const rel of PART_FILES) {
    const src = readFileSync(resolve(root, rel), "utf8")
    assert.match(src, /input-streaming/, rel)
    assert.match(src, /output-available/, rel)
    assert.match(src, /output-error/, rel)
    assert.doesNotMatch(
      src,
      /if \(part\.state !== "output-available"\) \{\s*return null/,
      `${rel} still drops pending tool states`
    )
  }
})
