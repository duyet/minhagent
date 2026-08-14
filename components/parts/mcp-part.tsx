import { PlugIcon } from "lucide-react"

import { type McpCallPart, type McpListToolsPart } from "@/tools"
import { Spinner } from "@/components/ui/spinner"

export function McpListPart({ part }: { part: McpListToolsPart }) {
  switch (part.state) {
    case "input-streaming":
    case "input-available":
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner />
          Listing MCP tools…
        </div>
      )
    case "output-available":
      return (
        <div className="flex items-center gap-2 px-1.5 text-sm text-muted-foreground">
          <PlugIcon className="size-4" />
          <span className="font-medium text-foreground">
            {part.output.tools.length} MCP tools
          </span>
          <span>({part.output.server})</span>
        </div>
      )
    case "output-error":
      return (
        <div className="text-sm text-destructive">
          MCP list failed: {part.errorText}
        </div>
      )
    default:
      return null
  }
}

export function McpCallPartView({ part }: { part: McpCallPart }) {
  switch (part.state) {
    case "input-streaming":
    case "input-available":
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner />
          Calling MCP {part.input?.name ?? "tool"}…
        </div>
      )
    case "output-available":
      return (
        <div className="flex flex-col gap-1 px-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <PlugIcon className="size-4" />
            <span className="font-medium text-foreground">{part.output.name}</span>
            <span>({part.output.server})</span>
          </div>
          <pre className="max-h-40 overflow-auto whitespace-pre-wrap font-mono text-xs text-foreground">
            {part.output.text.slice(0, 2000)}
          </pre>
        </div>
      )
    case "output-error":
      return (
        <div className="text-sm text-destructive">
          MCP call failed: {part.errorText}
        </div>
      )
    default:
      return null
  }
}
