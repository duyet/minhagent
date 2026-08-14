import { WrenchIcon } from "lucide-react"

import { Spinner } from "@/components/ui/spinner"

type GenericToolState =
  | "input-streaming"
  | "input-available"
  | "approval-requested"
  | "approval-responded"
  | "output-available"
  | "output-error"
  | "output-denied"
  | (string & {})

export function DynamicToolPart({
  name,
  state,
  output,
  errorText,
}: {
  name: string
  state: GenericToolState
  output?: unknown
  errorText?: string
}) {
  switch (state) {
    case "output-available":
      return (
        <div className="flex flex-col gap-1 px-1.5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <WrenchIcon className="size-4" />
            <span className="font-medium text-foreground">{name}</span>
          </div>
          <pre className="max-h-40 overflow-auto whitespace-pre-wrap font-mono text-xs text-foreground">
            {formatToolValue(output)}
          </pre>
        </div>
      )
    case "output-error":
    case "output-denied":
      return (
        <div className="text-sm text-destructive">
          {name} failed{errorText ? `: ${errorText}` : ""}
        </div>
      )
    default:
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner />
          Running {name}…
        </div>
      )
  }
}

function formatToolValue(value: unknown) {
  if (typeof value === "string") return value
  try {
    return JSON.stringify(value, null, 2) ?? "done"
  } catch {
    return String(value)
  }
}
