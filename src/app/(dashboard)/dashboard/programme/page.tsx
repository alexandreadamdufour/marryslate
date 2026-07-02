import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { getMyWedding } from "@/queries/wedding"
import { getWeddingEvents } from "@/queries/events"
import { WeddingEventsEditor } from "@/components/dashboard/wedding-events-editor"

export const metadata: Metadata = { title: "Programme" }

export default async function ProgrammePage() {
  const wedding = await getMyWedding()
  if (!wedding) notFound()

  const events = await getWeddingEvents(wedding.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Programme</h1>
        <p className="text-sm text-muted-foreground">
          Les événements de votre journée — affichés sur votre site dans l&apos;ordre que vous définissez.
        </p>
      </div>

      <WeddingEventsEditor initialEvents={events} weddingId={wedding.id} />
    </div>
  )
}
