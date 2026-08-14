import type { Metadata } from "next"

import { getModels } from "@/lib/models"
import { Chat } from "@/components/chat"

export const metadata: Metadata = {
  title: "Minh",
  description: "Minh is a coding agent. Chat UI for the Minh harness.",
}

export default async function Page() {
  const models = await getModels()
  return <Chat models={models} />
}
