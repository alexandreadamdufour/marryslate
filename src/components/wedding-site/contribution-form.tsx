"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import imageCompression from "browser-image-compression"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js"
import { Loader2, Upload, X } from "lucide-react"
import Image from "next/image"
import { createPaymentIntent, uploadContributorPhoto } from "@/actions/contributions"
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
import { toast } from "sonner"
import type { Gift } from "@/queries/gifts"

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
if (!stripeKey) throw new Error("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY manquant — configurer la variable d'environnement")
const stripePromise = loadStripe(stripeKey)

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
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const form = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      giftId: defaultGiftId ?? null,
      guestName: "",
      guestEmail: "",
      guestMessage: "",
      contributorPhotoUrl: null,
      grossAmountEuros: 50,
      isAnonymous: false,
    },
  })

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
      })
      const fd = new FormData()
      fd.append("file", compressed, file.name)
      fd.append("weddingSlug", weddingSlug)
      const result = await uploadContributorPhoto(fd)
      if (result.error || result.data === undefined) {
        toast.error("Erreur lors de l'upload de la photo.")
        return
      }
      setPhotoUrl(result.data.url)
    } catch {
      toast.error("Erreur lors de la compression de la photo.")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  async function onSubmit(values: Step1Values) {
    const result = await createPaymentIntent({ ...values, contributorPhotoUrl: photoUrl, weddingSlug })
    if ("error" in result) {
      const messages: Record<string, string> = {
        INVALID_INPUT: "Données invalides, vérifiez le formulaire.",
        WEDDING_NOT_FOUND: "Ce mariage est introuvable.",
        PAYMENTS_NOT_CONFIGURED: "Les paiements ne sont pas encore activés pour ce mariage.",
        GIFT_NOT_FOUND: "Ce cadeau n'est plus disponible.",
        STRIPE_ERROR: "Erreur de paiement, réessayez.",
        DB_ERROR: "Erreur serveur, réessayez.",
      }
      toast.error(messages[result.error as string] ?? "Une erreur est survenue.")
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

        {/* Photo souvenir */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Joindre un souvenir <span className="font-normal text-muted-foreground">(optionnel)</span></p>
          {photoUrl ? (
            <div className="relative w-full">
              <Image
                src={photoUrl}
                alt="Aperçu de votre photo"
                width={400}
                height={200}
                className="h-40 w-full rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={() => setPhotoUrl(null)}
                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                aria-label="Supprimer la photo"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <label
              className={[
                "flex h-28 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-input bg-muted/40 text-sm text-muted-foreground transition-colors",
                uploading ? "opacity-60" : "hover:bg-muted/60",
              ].join(" ")}
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              ) : (
                <>
                  <Upload className="h-5 w-5" aria-hidden="true" />
                  <span>Ajouter une photo (JPG, PNG, WebP — max 5 Mo)</span>
                </>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={uploading}
                onChange={handlePhotoChange}
              />
            </label>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting || uploading}
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
  const [loading, setLoading] = useState(false)

  async function handlePay() {
    if (!stripe || !elements) return
    setLoading(true)

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    })

    // confirmPayment only returns here on error — success redirects
    if (stripeError) {
      toast.error(stripeError.message ?? "Une erreur est survenue lors du paiement.")
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <PaymentElement />
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
