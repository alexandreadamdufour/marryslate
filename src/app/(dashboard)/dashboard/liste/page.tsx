import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getMyWedding } from "@/queries/wedding"
import { getGiftsByWedding } from "@/queries/gifts"
import { GiftListEditor } from "@/components/dashboard/gift-list-editor"

export const metadata: Metadata = { title: "Liste de cadeaux" }

export default async function ListePage() {
  const wedding = await getMyWedding()
  if (!wedding) notFound()

  const gifts = await getGiftsByWedding(wedding.id)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Liste de cadeaux</h1>
        <p className="text-sm text-muted-foreground">
          {gifts.length} cadeau{gifts.length !== 1 ? "x" : ""} — glissez pour réorganiser.
        </p>
      </div>
      <GiftListEditor initialGifts={gifts} weddingId={wedding.id} />
    </div>
  )
}
