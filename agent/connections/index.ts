import anyrouter from "./anyrouter"
import duyet from "./duyet"

export const MCP_CONNECTIONS = {
  duyet,
  anyrouter,
} as const

export type McpConnectionName = keyof typeof MCP_CONNECTIONS
export type McpConnectionAuth = (typeof MCP_CONNECTIONS)[McpConnectionName]["auth"]

export const DEFAULT_MCP_SERVER: McpConnectionName = "duyet"
export const DEFAULT_MCP_URL = MCP_CONNECTIONS.duyet.url
