import { CodeIcon } from "lucide-react"

import { type ExecuteSnippetToolPart } from "@/tools"
import { Spinner } from "@/components/ui/spinner"

export function SnippetPart({ part }: { part: ExecuteSnippetToolPart }) {
  switch (part.state) {
    case "input-streaming":
    case "input-available":
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner />
          Running snippet…
        </div>
      )
    case "output-available":
      return (
        <div className="flex items-center gap-2 px-1.5 text-sm text-muted-foreground">
          <CodeIcon className="size-4" />
          <span className="font-medium text-foreground">
            {String(part.output.result)}
          </span>
          <span>({part.output.backend})</span>
        </div>
      )
    case "output-error":
      return (
        <div className="text-sm text-destructive">
          Snippet failed: {part.errorText}
        </div>
      )
    default:
      return null
  }
}
