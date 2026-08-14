import { tool } from "ai"
import { z } from "zod"

import { executeSnippet } from "@/lib/snippet"

export const executeSnippetTool = tool({
  description:
    "Run a small JavaScript snippet on Cloudflare Computer (or the isolate fallback). Return the computed value.",
  inputSchema: z.object({
    code: z
      .string()
      .describe("JavaScript expression or body, e.g. 1+1 or return 2+3"),
  }),
  outputSchema: z.object({
    result: z.unknown(),
    backend: z.enum(["computer", "isolate"]),
  }),
  execute: async ({ code }) => executeSnippet(code, null),
})
