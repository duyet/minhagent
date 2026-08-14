export const MCP_SERVERS: Record<string, { url: string; auth: "anyrouter" | "none"; blurb: string }> =
  {
    duyet: {
      url: "https://mcp.duyet.net/mcp",
      auth: "none",
      blurb:
        "Duyet: github_activity, blog posts, say_hi, hire_me, send_message, analytics",
    },
    anyrouter: {
      url: "https://anyrouter.dev/api/v1/mcp",
      auth: "anyrouter",
      blurb: "AnyRouter: models, credits, presets, hub",
    },
  }

export const DEFAULT_MCP_SERVER = "duyet"
export const DEFAULT_MCP_URL = MCP_SERVERS.duyet.url

export type McpContent = { type?: string; text?: string }

export type McpTool = {
  name: string
  description?: string
  inputSchema?: unknown
}

type JsonRpcOk = {
  result?: {
    tools?: McpTool[]
    content?: McpContent[]
    isError?: boolean
  }
  error?: { code?: number; message?: string }
}

function parseJsonRpcBody(text: string): JsonRpcOk {
  const trimmed = text.trim()
  if (trimmed.startsWith("{")) {
    return JSON.parse(trimmed) as JsonRpcOk
  }
  for (const line of trimmed.split("\n")) {
    const payload = line.startsWith("data:") ? line.slice(5).trim() : ""
    if (payload.startsWith("{")) {
      return JSON.parse(payload) as JsonRpcOk
    }
  }
  throw new Error("MCP response is not JSON-RPC")
}

export function resolveMcpUrl(server?: string): { name: string; url: string; auth: "anyrouter" | "none" } {
  const raw = (server ?? DEFAULT_MCP_SERVER).trim()
  if (raw === "") {
    return { name: DEFAULT_MCP_SERVER, url: DEFAULT_MCP_URL, auth: "none" }
  }
  const named = MCP_SERVERS[raw.toLowerCase()]
  if (named) {
    return { name: raw.toLowerCase(), url: named.url, auth: named.auth }
  }
  if (raw.startsWith("https://") || raw.startsWith("http://")) {
    return { name: raw, url: raw, auth: "none" }
  }
  return { name: DEFAULT_MCP_SERVER, url: DEFAULT_MCP_URL, auth: "none" }
}

async function mcpRpc(
  url: string,
  method: string,
  params: Record<string, unknown>,
  auth: "anyrouter" | "none"
): Promise<JsonRpcOk> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json, text/event-stream",
  }
  if (auth === "anyrouter" && process.env.ANYROUTER_API_KEY) {
    headers.authorization = `Bearer ${process.env.ANYROUTER_API_KEY}`
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method,
      params,
    }),
  })
  const text = await res.text()
  let json: JsonRpcOk
  try {
    json = parseJsonRpcBody(text)
  } catch {
    throw new Error(`MCP ${res.status}: ${text.slice(0, 240)}`)
  }
  if (!res.ok) {
    throw new Error(
      json.error?.message ?? `MCP ${res.status}: ${text.slice(0, 240)}`
    )
  }
  if (json.error) {
    throw new Error(json.error.message ?? "MCP error")
  }
  return json
}

export async function listMcpTools(server?: string): Promise<{
  server: string
  url: string
  tools: McpTool[]
}> {
  if (!server?.trim()) {
    const all: McpTool[] = []
    for (const [name, spec] of Object.entries(MCP_SERVERS)) {
      try {
        const json = await mcpRpc(spec.url, "tools/list", {}, spec.auth)
        for (const tool of json.result?.tools ?? []) {
          all.push({
            ...tool,
            name: `${name}/${tool.name}`,
            description: `[${name}] ${tool.description ?? tool.name}`,
          })
        }
      } catch (err) {
        all.push({
          name: `${name}/(error)`,
          description: err instanceof Error ? err.message : String(err),
        })
      }
    }
    return { server: "all", url: "catalog", tools: all }
  }

  const target = resolveMcpUrl(server)
  const json = await mcpRpc(target.url, "tools/list", {}, target.auth)
  return {
    server: target.name,
    url: target.url,
    tools: json.result?.tools ?? [],
  }
}

export async function callMcpTool(
  name: string,
  args?: Record<string, unknown>,
  server?: string
): Promise<{
  server: string
  url: string
  name: string
  isError: boolean
  text: string
}> {
  let toolName = name
  let target = resolveMcpUrl(server)
  const slash = name.indexOf("/")
  if (!server?.trim() && slash > 0) {
    const prefix = name.slice(0, slash)
    if (MCP_SERVERS[prefix]) {
      target = resolveMcpUrl(prefix)
      toolName = name.slice(slash + 1)
    }
  }

  const json = await mcpRpc(
    target.url,
    "tools/call",
    { name: toolName, arguments: args ?? {} },
    target.auth
  )
  const blocks = json.result?.content ?? []
  const text = blocks
    .map((b) => b.text ?? "")
    .filter(Boolean)
    .join("\n")
  return {
    server: target.name,
    url: target.url,
    name: toolName,
    isError: Boolean(json.result?.isError),
    text: text || "(empty)",
  }
}
