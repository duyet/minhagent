import { ToolLoopAgent, isStepCount, type LanguageModel } from "ai"

import { buildMinhSystemPrompt } from "@/lib/persona"
import { getTools } from "@/tools"

export const MAX_OUTPUT_TOKENS = 2048
export const MAX_STEPS = 8

export function createMinhAgent(
  model: LanguageModel,
  tools: ReturnType<typeof getTools>
) {
  return new ToolLoopAgent({
    model,
    instructions: buildMinhSystemPrompt(Object.keys(tools)),
    tools,
    stopWhen: isStepCount(MAX_STEPS),
    maxOutputTokens: MAX_OUTPUT_TOKENS,
  })
}
