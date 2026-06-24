"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { createPaymentIntent } from "@/actions/contributions"
import { createContributionSchema } from "@/lib/validators/contributions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Gift } from "@/queries/gifts"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// Step 1 schema — same as server validator but coerces amount from string input
const step1Schema = createContributionSchema.omit({ weddingSlug: true })
type Step1Values = z.infer<typeof step1Schema>

interface Step1FormProps {
  gifts: Gift[]
  defaultGiftId: string | null
  onSuccess: (clientSecret: string) => void
  weddingSlug: string
}

function Step1Form({ gifts, defaultGiftId, onSuccess, weddingSlug }: Step1FormProps) {
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      giftId: defaultGiftId ?? null,
      guestName: "",
      guestEmail: "",
      guestMessage: "",
      grossAmountEuros: 50,
      isAnonymous: false,
    },
  })

  async function onSubmit(values: Step1Values) {
    setServerError(null)
    const result = await createPaymentIntent({ ...values, weddingSlug })
    if ("error" in result) {
      const messages: Record<string, string> = {
        INVALID_INPUT: "Données invalides, vérifiez le formulaire.",
        WEDDING_NOT_FOUND: "Ce mariage est introuvable.",
        PAYMENTS_NOT_CONFIGURED: "Les paiements ne sont pas encore activés pour ce mariage.",
        GIFT_NOT_FOUND: "Ce cadeau n'est plus disponible.",
        STRIPE_ERROR: "Erreur de paiement, réessayez.",
        DB_ERROR: "Erreur serveur, réessayez.",
      }
      setServerError(messages[result.error as string] ?? "Une erreur est survenue.")
      return
    }
    onSuccess(result.data.clientSecret)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="guestName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Votre prénom *</FormLabel>
              <FormControl>
                <Input placeholder="Sophie" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="guestEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email (pour le reçu)</FormLabel>
              <FormControl>
                <Input type="email" placeholder="sophie@exemple.fr" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="grossAmountEuros"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Montant *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type="number"
                    min={5}
                    max={5000}
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

        {gifts.length > 0 && (
          <FormField
            control={form.control}
            name="giftId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cadeau (optionnel)</FormLabel>
                <Select
                  onValueChange={(v) => field.onChange(v === "none" ? null : v)}
                  defaultValue={field.value ?? "none"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Contribution libre" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="none">Contribution libre</SelectItem>
                    {gifts.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.title}{" "}
                        <span className="text-muted-foreground">
                          — {Number(g.target_amount).toLocaleString("fr-FR")} €
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="guestMessage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message (optionnel)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tous nos voeux de bonheur !"
                  maxLength={500}
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {serverError && (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Chargement…" : "Continuer vers le paiement"}
        </Button>
      </form>
    </Form>
  )
}

interface PaymentStepProps {
  returnUrl: string
}

function PaymentStep({ returnUrl }: PaymentStepProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handlePay() {
    if (!stripe || !elements) return
    setLoading(true)
    setError(null)

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    })

    // confirmPayment only returns here on error — success redirects
    if (stripeError) {
      setError(stripeError.message ?? "Une erreur est survenue lors du paiement.")
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <PaymentElement />
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button onClick={handlePay} disabled={loading || !stripe} className="w-full">
        {loading ? "Traitement…" : "Payer maintenant"}
      </Button>
    </div>
  )
}

interface ContributionFormProps {
  gifts: Gift[]
  defaultGiftId: string | null
  weddingSlug: string
  successUrl: string
}

export function ContributionForm({
  gifts,
  defaultGiftId,
  weddingSlug,
  successUrl,
}: ContributionFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  if (!clientSecret) {
    return (
      <Step1Form
        gifts={gifts}
        defaultGiftId={defaultGiftId}
        weddingSlug={weddingSlug}
        onSuccess={setClientSecret}
      />
    )
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret, locale: "fr" }}
    >
      <PaymentStep returnUrl={successUrl} />
    </Elements>
  )
}
