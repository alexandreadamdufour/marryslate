import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getMyWedding } from "@/queries/wedding"
import { getGuestsByWedding } from "@/queries/guests"
import { getRsvpResponsesByWedding } from "@/queries/rsvp"
import { InvitesTabs } from "@/components/dashboard/invites-tabs"
import { RsvpToggle } from "@/components/dashboard/rsvp-toggle"

export const metadata: Metadata = { title: "Invités" }

export default async function InvitesPage() {
  const wedding = await getMyWedding()
  if (!wedding) notFound()

  const [guests, rsvpData] = await Promise.all([
    getGuestsByWedding(wedding.id),
    getRsvpResponsesByWedding(wedding.id),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Invités</h1>
          <p className="text-sm text-muted-foreground">
            {guests.length} invité{guests.length !== 1 ? "s" : ""} — gérez la liste et suivez les RSVP.
          </p>
        </div>
        <RsvpToggle weddingId={wedding.id} initialEnabled={wedding.rsvp_enabled} />
      </div>
      <InvitesTabs weddingId={wedding.id} guests={guests} rsvpData={rsvpData} />
    </div>
  )
}
