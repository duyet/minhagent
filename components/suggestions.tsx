"use client"

import { Button } from "@/components/ui/button"

const suggestions = [
  {
    label: "Who is Minh?",
    prompt: "Who are you? Introduce yourself as Minh in one short paragraph.",
  },
  {
    label: "Run a snippet",
    prompt: "Use execute_snippet to evaluate return 2+3 and tell me the result.",
  },
  {
    label: "Look up a repo",
    prompt: "What are the GitHub stats for duyet/minhagent?",
  },
  {
    label: "What's new",
    prompt:
      "Search the web for the latest Cloudflare Workers agent news and summarize it.",
  },
]

export function Suggestions({
  onSelect,
}: {
  onSelect: (prompt: string) => void
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {suggestions.map((suggestion) => (
        <Button
          key={suggestion.label}
          variant="outline"
          size="sm"
          onClick={() => onSelect(suggestion.prompt)}
        >
          {suggestion.label}
        </Button>
      ))}
    </div>
  )
}
