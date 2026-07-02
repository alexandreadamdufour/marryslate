"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { GuestEditor } from "@/components/dashboard/guest-editor"
import { RsvpResponsesPanel } from "@/components/dashboard/rsvp-responses-panel"
import type { Guest } from "@/queries/guests"
import type { RsvpResponsesByStatus } from "@/queries/rsvp"

interface Props {
  weddingId: string
  guests: Guest[]
  rsvpData: RsvpResponsesByStatus
}

export function InvitesTabs({ weddingId, guests, rsvpData }: Props) {
  const pendingCount = rsvpData.counts.pendingValidation

  return (
    <Tabs defaultValue="liste">
      <TabsList>
        <TabsTrigger value="liste">Liste</TabsTrigger>
        <TabsTrigger value="reponses" className="gap-2">
          Réponses
          {pendingCount > 0 && (
            <Badge className="border-transparent bg-orange-100 px-1.5 py-0 text-xs text-orange-800">
              {pendingCount}
            </Badge>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="liste">
        <GuestEditor initialGuests={guests} weddingId={weddingId} />
      </TabsContent>

      <TabsContent value="reponses">
        <RsvpResponsesPanel data={rsvpData} guests={guests} weddingId={weddingId} />
      </TabsContent>
    </Tabs>
  )
}
