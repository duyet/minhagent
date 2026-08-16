import instructions from "@/agent/instructions"

/** One-line snippets for tools Minh actually exposes. Keep in sync with `agent/tools/`. */
export const TOOL_SNIPPETS: Record<string, string> = {
  execute_snippet:
    "Run a small JavaScript snippet (Cloudflare Computer, isolate fallback).",
  get_time: "Current date and time, optional IANA timezone.",
  get_weather: "Weather for a location.",
  github_repo: "Public GitHub repo stats (stars, forks, issues).",
  scrape_page: "Fetch and extract text from a URL.",
  web_search: "Search the web.",
  ask_user: "Ask the user a structured clarifying question.",
  mcp_list_tools: "List tools on a connected MCP server.",
  mcp_call: "Call a tool on a connected MCP server.",
}

export {
  DEFAULT_MCP_SERVER,
  DEFAULT_MCP_URL,
} from "@/agent/connections"

/**
 * Lean system prompt: Eve `agent/instructions` plus the live tool list.
 */
export function buildMinhSystemPrompt(toolNames: string[]): string {
  const visible = toolNames.filter((name) => TOOL_SNIPPETS[name])
  const toolsList =
    visible.length > 0
      ? visible.map((name) => `- ${name}: ${TOOL_SNIPPETS[name]}`).join("\n")
      : "(none)"

  return `${instructions}

Available tools:
${toolsList}`
}

export const MINH_SYSTEM = buildMinhSystemPrompt(Object.keys(TOOL_SNIPPETS))
