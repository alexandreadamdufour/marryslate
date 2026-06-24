import type { Metadata } from "next"

export const metadata: Metadata = { title: "Liste de cadeaux" }

export default function ListePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Liste de cadeaux</h1>
        <p className="text-sm text-muted-foreground">Gérez vos idées cadeaux.</p>
      </div>
      <p className="text-muted-foreground">— Sprint 2</p>
    </div>
  )
}
