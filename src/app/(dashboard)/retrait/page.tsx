import type { Metadata } from "next"

export const metadata: Metadata = { title: "Retrait" }

export default function RetraitPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Retrait</h1>
        <p className="text-sm text-muted-foreground">Retirez les fonds collectés.</p>
      </div>
      <p className="text-muted-foreground">— Sprint 3 (KYC requis)</p>
    </div>
  )
}
