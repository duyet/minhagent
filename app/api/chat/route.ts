import { createAgentUIStreamResponse, validateUIMessages } from "ai"

import { anyrouter } from "@/lib/anyrouter"
import { createMinhAgent } from "@/lib/chat-agent"
import { getGateway } from "@/lib/gateway"
import { isGatewayModelId, stripGatewayPrefix } from "@/lib/gateway-models"
import { DEFAULT_MODEL, getModels, isModelAllowed } from "@/lib/models"
import { getTools, type ChatUIMessage } from "@/tools"

// Wall-clock budget for a multi-step tool loop (model + tools + follow-up).
export const maxDuration = 60

// This endpoint is public and spends your AnyRouter credits on every request.
// Before exposing it to real traffic, add a rate limit (e.g. Vercel Firewall /
// WAF or @upstash/ratelimit), authentication, and an AnyRouter spend limit.
// See the README "Security" section.
export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const model = (body as { model?: unknown })?.model
  const modelId = typeof model === "string" ? model : DEFAULT_MODEL

  const models = await getModels()
  if (!isModelAllowed(modelId, models)) {
    return Response.json(
      { error: `Model ${modelId} is not available.` },
      { status: 400 }
    )
  }

  const tools = getTools(modelId)

  // Validate the shape of every message and tool part before trusting it.
  let messages: ChatUIMessage[]
  try {
    const validated = await validateUIMessages<ChatUIMessage>({
      messages: (body as { messages?: unknown })?.messages,
      tools: tools as Parameters<typeof validateUIMessages>[0]["tools"],
    })
    messages = validated
  } catch {
    return Response.json({ error: "Invalid messages." }, { status: 400 })
  }

  const agent = createMinhAgent(
    isGatewayModelId(modelId)
      ? getGateway()(stripGatewayPrefix(modelId))
      : anyrouter.chat(modelId),
    tools
  )

  return createAgentUIStreamResponse({
    agent,
    uiMessages: messages,
    sendSources: true,
    abortSignal: req.signal,
    onError: () => "Something went wrong. Please try again.",
  })
}
