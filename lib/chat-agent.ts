import { ToolLoopAgent, isStepCount, type LanguageModel } from "ai"

import agentConfig, {
  MAX_OUTPUT_TOKENS,
  MAX_STEPS,
} from "@/agent/agent"
import { buildMinhSystemPrompt } from "@/lib/persona"
import { getTools } from "@/tools"

export { MAX_OUTPUT_TOKENS, MAX_STEPS }

export function createMinhAgent(
  model: LanguageModel,
  tools: ReturnType<typeof getTools>
) {
  return new ToolLoopAgent({
    model,
    instructions: buildMinhSystemPrompt(Object.keys(tools)),
    tools,
    stopWhen: isStepCount(agentConfig.stopWhenSteps),
    maxOutputTokens: agentConfig.maxOutputTokens,
  })
}
