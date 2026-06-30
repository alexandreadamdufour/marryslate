import { SignUp } from "@clerk/nextjs"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Inscription" }

export default function InscriptionPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <SignUp
        routing="path"
        path="/inscription"
        fallbackRedirectUrl="/onboarding/etape-1"
        signInUrl="/connexion"
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-none border border-border rounded-xl",
          },
        }}
      />
    </div>
  )
}
