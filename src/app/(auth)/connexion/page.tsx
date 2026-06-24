import { SignIn } from "@clerk/nextjs"
import type { Metadata } from "next"

export const metadata: Metadata = { title: "Connexion" }

export default function ConnexionPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-none border border-border rounded-xl",
          },
        }}
        redirectUrl="/dashboard"
        signUpUrl="/inscription"
      />
    </div>
  )
}
