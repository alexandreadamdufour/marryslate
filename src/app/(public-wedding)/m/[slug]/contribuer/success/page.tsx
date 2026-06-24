import Link from "next/link"
import type { Metadata } from "next"
import { CheckCircle, XCircle } from "lucide-react"
import { stripe } from "@/lib/stripe/client"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = { title: "Confirmation de contribution" }

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{
    payment_intent?: string
    redirect_status?: string
  }>
}

export default async function ContributionSuccessPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { payment_intent: piId, redirect_status } = await searchParams

  const succeeded = redirect_status === "succeeded" && !!piId

  // Retrieve metadata from Stripe to show a personalised message
  let guestName: string | null = null
  if (succeeded && piId) {
    try {
      const pi = await stripe.paymentIntents.retrieve(piId)
      guestName = pi.metadata?.guest_name ?? null
    } catch {
      // Non-blocking
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="mx-auto max-w-md text-center">
        {succeeded ? (
          <>
            <CheckCircle className="mx-auto mb-6 h-16 w-16 text-green-500" />
            <h1 className="mb-3 text-3xl">Merci{guestName ? `, ${guestName}` : ""} !</h1>
            <p className="mb-8 text-muted-foreground">
              Votre contribution a bien été reçue. Le couple vous remercie chaleureusement.
              Un reçu vous a été envoyé par email si vous en avez fourni un.
            </p>
          </>
        ) : (
          <>
            <XCircle className="mx-auto mb-6 h-16 w-16 text-destructive" />
            <h1 className="mb-3 text-3xl">Paiement non abouti</h1>
            <p className="mb-8 text-muted-foreground">
              Votre paiement n&apos;a pas pu être traité. Aucun montant n&apos;a été débité.
            </p>
          </>
        )}

        <Button asChild>
          <Link href={`/m/${slug}`}>Retour au site du mariage</Link>
        </Button>
      </div>
    </div>
  )
}
