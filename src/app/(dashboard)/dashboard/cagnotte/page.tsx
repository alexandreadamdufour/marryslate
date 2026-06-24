import type { Metadata } from "next"

export const metadata: Metadata = { title: "Cagnotte" }

export default function CagnottePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Cagnotte libre</h1>
        <p className="text-sm text-muted-foreground">Recevez des contributions libres.</p>
      </div>
      <p className="text-muted-foreground">— Sprint 3</p>
    </div>
  )
}
