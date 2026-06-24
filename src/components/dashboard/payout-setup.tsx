"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { setupStripeConnect, requestPayout } from "@/actions/withdrawals"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Alert, AlertDescription } from "@/components/ui/alert"

const payoutSchema = z.object({
  amountEuros: z.number().min(1, "Minimum 1 €").max(50000),
})

interface PayoutSetupProps {
  hasStripeAccount: boolean
  isActive: boolean
  availableEuros: number
}

export function PayoutSetup({ hasStripeAccount, isActive, availableEuros }: PayoutSetupProps) {
  const [onboardingLoading, setOnboardingLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const form = useForm<z.infer<typeof payoutSchema>>({
    resolver: zodResolver(payoutSchema),
    defaultValues: { amountEuros: availableEuros > 0 ? Math.floor(availableEuros) : 1 },
  })

  async function handleSetupConnect() {
    setOnboardingLoading(true)
    const result = await setupStripeConnect()
    if ("error" in result) {
      const connectErrors: Record<string, string> = {
        UNAUTHORIZED: "Session expirée, veuillez vous reconnecter.",
        USER_NOT_FOUND: "Votre compte est introuvable. Reconnectez-vous.",
        MIGRATION_NOT_APPLIED: "La migration base de données n'a pas été appliquée. Exécutez pnpm supabase db push.",
        DB_ERROR: "Erreur base de données. Vérifiez les logs serveur.",
        STRIPE_API_ERROR: "Erreur Stripe. Vérifiez la clé STRIPE_SECRET_KEY dans .env.local.",
      }
      setMessage({
        type: "error",
        text: connectErrors[result.error as string] ?? `Erreur inattendue : ${result.error}`,
      })
      setOnboardingLoading(false)
      return
    }
    window.location.href = result.data.onboardingUrl
  }

  async function onSubmitPayout(values: z.infer<typeof payoutSchema>) {
    setMessage(null)
    const result = await requestPayout(values.amountEuros)
    if ("error" in result) {
      const messages: Record<string, string> = {
        INSUFFICIENT_BALANCE: "Solde insuffisant.",
        AMOUNT_TOO_LOW: "Montant minimum : 1 €.",
        STRIPE_NOT_CONFIGURED: "Compte bancaire non configuré.",
        UNAUTHORIZED: "Non autorisé.",
      }
      setMessage({ type: "error", text: messages[result.error as string] ?? "Erreur lors du retrait." })
      return
    }
    setMessage({ type: "success", text: `Retrait de ${values.amountEuros} € initié. Il apparaîtra sous 1 à 3 jours ouvrés.` })
    form.reset({ amountEuros: 0 })
  }

  // Step 1 — no Stripe account yet
  if (!hasStripeAccount) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-2 text-lg font-semibold">Configurer votre compte bancaire</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Pour recevoir les fonds collectés, vous devez connecter un compte bancaire via Stripe.
          La vérification d&apos;identité (KYC) est requise par la réglementation européenne.
        </p>
        {message?.type === "error" && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}
        <Button onClick={handleSetupConnect} disabled={onboardingLoading}>
          {onboardingLoading ? "Redirection…" : "Configurer le compte Stripe"}
        </Button>
      </div>
    )
  }

  // Step 2 — account exists but not yet active (KYC pending)
  if (!isActive) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <h2 className="mb-2 text-lg font-semibold">Vérification en cours</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Votre dossier KYC est en cours de vérification par Stripe. Vous recevrez un email
          lorsque votre compte sera activé et que les retraits seront disponibles.
        </p>
        <Button variant="outline" onClick={handleSetupConnect} disabled={onboardingLoading}>
          {onboardingLoading ? "Redirection…" : "Reprendre la vérification"}
        </Button>
      </div>
    )
  }

  // Step 3 — account active, show payout form
  return (
    <div className="rounded-xl border bg-card p-6">
      <h2 className="mb-1 text-lg font-semibold">Demander un retrait</h2>
      <p className="mb-6 text-sm text-muted-foreground">
        Solde disponible :{" "}
        <span className="font-semibold text-foreground">
          {availableEuros.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
        </span>
      </p>

      {availableEuros <= 0 ? (
        <Alert>
          <AlertDescription>
            Aucun fonds disponible pour le moment. Les contributions confirmées apparaissent ici
            après traitement par Stripe (généralement quelques minutes).
          </AlertDescription>
        </Alert>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmitPayout)} className="space-y-4">
            <FormField
              control={form.control}
              name="amountEuros"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Montant à retirer</FormLabel>
                  <FormControl>
                    <div className="relative max-w-xs">
                      <Input
                        type="number"
                        min={1}
                        max={availableEuros}
                        step={1}
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        className="pr-8"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        €
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {message && (
              <Alert variant={message.type === "error" ? "destructive" : "success"}>
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Traitement…" : "Demander le retrait"}
            </Button>
          </form>
        </Form>
      )}
    </div>
  )
}
