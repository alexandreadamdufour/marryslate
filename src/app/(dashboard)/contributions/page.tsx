import type { Metadata } from "next"

export const metadata: Metadata = { title: "Contributions" }

export default function ContributionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Contributions</h1>
        <p className="text-sm text-muted-foreground">Suivez les contributions reçues.</p>
      </div>
      <p className="text-muted-foreground">— Sprint 3</p>
    </div>
  )
}
