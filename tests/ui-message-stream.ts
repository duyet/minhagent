import {
  parseJsonEventStream,
  readUIMessageStream,
  uiMessageChunkSchema,
  type UIMessage,
  type UIMessageChunk,
} from "ai"

export type ChatE2ESummary = {
  status: number
  raw: string
  chunks: UIMessageChunk[]
  message: UIMessage | undefined
  toolNames: string[]
  snippetOutput: unknown
}

/** Consume a shipped AI SDK UI-message SSE body into chunks + the rebuilt message. */
export async function consumeUiMessageResponse(
  res: Response
): Promise<ChatE2ESummary> {
  const raw = await res.text()
  const bytes = new TextEncoder().encode(raw)
  const byteStream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes)
      controller.close()
    },
  })

  const chunks: UIMessageChunk[] = []
  const chunkStream = parseJsonEventStream({
    stream: byteStream,
    schema: uiMessageChunkSchema,
  }).pipeThrough(
    new TransformStream({
      transform(chunk, controller) {
        if (!chunk.success) {
          throw chunk.error
        }
        chunks.push(chunk.value)
        controller.enqueue(chunk.value)
      },
    })
  )

  let message: UIMessage | undefined
  for await (const next of readUIMessageStream({ stream: chunkStream })) {
    message = next
  }

  return {
    status: res.status,
    raw,
    chunks,
    message,
    toolNames: collectToolNames(chunks, message),
    snippetOutput: findSnippetOutput(message),
  }
}

export function collectToolNames(
  chunks: UIMessageChunk[],
  message: UIMessage | undefined
): string[] {
  const names = new Set<string>()
  for (const chunk of chunks) {
    if (
      (chunk.type === "tool-input-start" ||
        chunk.type === "tool-input-available") &&
      "toolName" in chunk &&
      typeof chunk.toolName === "string"
    ) {
      names.add(chunk.toolName)
    }
  }
  for (const part of message?.parts ?? []) {
    if (part.type === "dynamic-tool") {
      names.add(part.toolName)
    } else if (part.type.startsWith("tool-")) {
      names.add(part.type.slice("tool-".length))
    }
  }
  return [...names]
}

export function findSnippetOutput(message: UIMessage | undefined): unknown {
  for (const part of message?.parts ?? []) {
    const isSnippet =
      part.type === "tool-execute_snippet" ||
      (part.type === "dynamic-tool" &&
        "toolName" in part &&
        part.toolName === "execute_snippet")
    if (
      isSnippet &&
      "state" in part &&
      part.state === "output-available" &&
      "output" in part
    ) {
      return part.output
    }
  }
  return undefined
}

export function snippetResultIsTwo(output: unknown): boolean {
  if (!output || typeof output !== "object") return false
  return (output as { result?: unknown }).result === 2
}

export function snippetPayload() {
  return {
    model: process.env.CHAT_E2E_MODEL ?? "anyrouter/free",
    messages: [
      {
        id: "e2e-user-1",
        role: "user" as const,
        parts: [
          {
            type: "text" as const,
            text: "Use execute_snippet to evaluate 1+1. Do not compute it yourself.",
          },
        ],
      },
    ],
  }
}
