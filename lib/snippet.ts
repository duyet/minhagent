export type ComputerLike = {
  run?: (code: string) => Promise<unknown>
  eval?: (code: string) => Promise<unknown>
}

export type SnippetResult = {
  result: unknown
  backend: "computer" | "isolate"
}

function isolateEval(code: string): unknown {
  const trimmed = code.trim()
  if (!trimmed) throw new Error("empty snippet")
  const body = trimmed.startsWith("return")
    ? trimmed
    : /^(const |let |var |if |for |while |function |class |async |await |try )/.test(
          trimmed
        ) || trimmed.includes(";")
      ? `${trimmed}\nreturn undefined;`
      : `return (${trimmed});`
  const fn = new Function(body)
  return fn()
}

/** Run a small JS snippet. Prefer Cloudflare Computer when bound; else isolate. */
export async function executeSnippet(
  code: string,
  computer?: ComputerLike | null
): Promise<SnippetResult> {
  if (computer) {
    try {
      const run = computer.run ?? computer.eval
      if (run) {
        const result = await run(code)
        return { result, backend: "computer" }
      }
    } catch {
      // Free-plan / unbound Computer — fall through to isolate.
    }
  }
  return { result: isolateEval(code), backend: "isolate" }
}
