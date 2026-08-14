import assert from "node:assert/strict";
import { test } from "node:test";
import { executeSnippet } from "../src/tools/snippet.js";

test("isolate path evaluates 1+1", async () => {
  const out = await executeSnippet("1+1", null);
  assert.equal(out.backend, "isolate");
  assert.equal(out.result, 2);
});

test("isolate path evaluates return 2+3", async () => {
  const out = await executeSnippet("return 2+3", null);
  assert.equal(out.result, 5);
});

test("computer backend is used when bound, isolate when computer throws", async () => {
  const bound = await executeSnippet("1+1", {
    async run(code) {
      return `computer:${code}`;
    },
  });
  assert.equal(bound.backend, "computer");
  assert.equal(bound.result, "computer:1+1");

  const fallback = await executeSnippet("1+1", {
    async run() {
      throw new Error("Dynamic Workers not on Free plan");
    },
  });
  assert.equal(fallback.backend, "isolate");
  assert.equal(fallback.result, 2);
});
