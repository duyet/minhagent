import { type AskUserToolPart } from "@/tools"
import { Spinner } from "@/components/ui/spinner"

export function AskUserPart({ part }: { part: AskUserToolPart }) {
  switch (part.state) {
    case "input-streaming":
    case "input-available":
    case "approval-requested":
    case "approval-responded":
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner />
          Asking a question…
        </div>
      )
    case "output-available":
      return (
        <div className="typeset typeset-docs px-1">
          <ol>
            {part.output.map((entry) => (
              <li key={entry.question}>
                <span className="text-muted-foreground">{entry.question}</span>{" "}
                <span className="font-medium text-foreground">{entry.answer}</span>
              </li>
            ))}
          </ol>
        </div>
      )
    case "output-error":
    case "output-denied":
      return (
        <div className="text-sm text-destructive">
          Question failed{part.state === "output-error" ? `: ${part.errorText}` : ""}
        </div>
      )
    default:
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner />
          Asking a question…
        </div>
      )
  }
}
