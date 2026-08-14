import assert from "node:assert/strict"
import { test } from "node:test"
import { executeSnippet } from "../lib/snippet.ts"

test("isolate path evaluates 1+1", async () => {
  const out = await executeSnippet("1+1", null)
  assert.equal(out.backend, "isolate")
  assert.equal(out.result, 2)
})

test("isolate path evaluates return 2+3", async () => {
  const out = await executeSnippet("return 2+3", null)
  assert.equal(out.result, 5)
})
