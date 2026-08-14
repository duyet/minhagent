import { tool } from "ai"
import { z } from "zod"

import { callMcpTool, listMcpTools } from "@/lib/mcp"
import { DEFAULT_MCP_SERVER } from "@/lib/persona"

export const mcpListTools = tool({
  description:
    "List tools on a connected MCP server. Omit server to list both duyet and anyrouter. Named: duyet, anyrouter.",
  inputSchema: z.object({
    server: z
      .string()
      .optional()
      .describe(
        `MCP server name ("duyet", "anyrouter") or https URL. Default "${DEFAULT_MCP_SERVER}".`
      ),
  }),
  outputSchema: z.object({
    server: z.string(),
    url: z.string(),
    tools: z.array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
      })
    ),
  }),
  execute: async ({ server }) => {
    const out = await listMcpTools(server)
    return {
      server: out.server,
      url: out.url,
      tools: out.tools.map((t) => ({
        name: t.name,
        description: t.description,
      })),
    }
  },
})

export const mcpCall = tool({
  description:
    "Call a tool on a connected MCP server. Use mcp_list_tools first if you do not know the name or arguments.",
  inputSchema: z.object({
    name: z
      .string()
      .describe('MCP tool name, e.g. github_activity or "duyet/github_activity"'),
    arguments: z
      .record(z.string(), z.unknown())
      .optional()
      .describe("JSON arguments for the MCP tool"),
    server: z
      .string()
      .optional()
      .describe(
        `MCP server name ("duyet", "anyrouter") or https URL. Default "${DEFAULT_MCP_SERVER}".`
      ),
  }),
  outputSchema: z.object({
    server: z.string(),
    url: z.string(),
    name: z.string(),
    isError: z.boolean(),
    text: z.string(),
  }),
  execute: async ({ name, arguments: args, server }) =>
    callMcpTool(name, args, server),
})
