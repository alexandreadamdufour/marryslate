"use server"

import { headers } from "next/headers"
import { createAdminClient } from "@/lib/supabase/admin"
import { stripe } from "@/lib/stripe/client"
import { createContributionSchema, type CreateContributionInput } from "@/lib/validators/contributions"
import { COMMISSION_RATE, COMMISSION_FIXED } from "@/lib/constants"
import { getClientIp, checkPaymentIntentRateLimit, checkPhotoUploadRateLimit } from "@/lib/rate-limit"

type ActionResult<T> =
  | { data: T; error?: never }
  | { error: string; details?: unknown; data?: never }

export async function uploadContributorPhoto(
  formData: FormData
): Promise<ActionResult<{ url: string }>> {
  const file = formData.get("file") as File | null
  const weddingSlug = formData.get("weddingSlug") as string | null
  if (!file || !weddingSlug) return { error: "INVALID_INPUT" }

  const ip = getClientIp(await headers())
  if (!(await checkPhotoUploadRateLimit(ip, weddingSlug))) {
    return { error: "RATE_LIMITED" }
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"]
  if (!allowedTypes.includes(file.type)) return { error: "INVALID_FILE_TYPE" }
  if (file.size > 5 * 1024 * 1024) return { error: "FILE_TOO_LARGE" }

  // Vérifie que le mariage existe et est publié — seul garde anti-spam sans auth
  const supabase = createAdminClient()
  const { data: wedding } = await supabase
    .from("weddings")
    .select("id")
    .eq("slug", weddingSlug)
    .eq("is_published", true)
    .maybeSingle()
  if (!wedding) return { error: "WEDDING_NOT_FOUND" }

  const ext = file.type.split("/")[1]
  const path = `contributions/${wedding.id}/${Date.now()}.${ext}`
  const arrayBuffer = await file.arrayBuffer()

  const { error } = await supabase.storage
    .from("gift-images")
    .upload(path, arrayBuffer, { contentType: file.type, upsert: false })

  if (error) {
    console.error("[uploadContributorPhoto]", error.message)
    return { error: "UPLOAD_ERROR" }
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("gift-images").getPublicUrl(path)

  return { data: { url: publicUrl } }
}

function computeFees(grossEuros: number): { fee: number; net: number } {
  const fee = Math.ceil((grossEuros * COMMISSION_RATE + COMMISSION_FIXED) * 100) / 100
  return { fee: Math.round(fee * 100) / 100, net: Math.round((grossEuros - fee) * 100) / 100 }
}

export async function createPaymentIntent(
  input: CreateContributionInput
): Promise<ActionResult<{ clientSecret: string; contributionId: string }>> {
  const parsed = createContributionSchema.safeParse(input)
  if (!parsed.success) return { error: "INVALID_INPUT", details: parsed.error.flatten() }

  const ip = getClientIp(await headers())
  if (!(await checkPaymentIntentRateLimit(ip, parsed.data.weddingSlug))) {
    return { error: "RATE_LIMITED", details: undefined }
  }

  const { weddingSlug, giftId, guestName, guestEmail, guestMessage, contributorPhotoUrl, grossAmountEuros, isAnonymous } =
    parsed.data

  const supabase = createAdminClient()

  // 1. Récupérer le wedding + son compte Stripe Connect
  const { data: wedding } = await supabase
    .from("weddings")
    .select("id, stripe_account_id, is_published, partner1_first_name, partner2_first_name, slug")
    .eq("slug", weddingSlug)
    .eq("is_published", true)
    .maybeSingle()

  if (!wedding) return { error: "WEDDING_NOT_FOUND" }
  if (!wedding.stripe_account_id) return { error: "PAYMENTS_NOT_CONFIGURED" }

  // 2. Vérifier le cadeau si fourni
  if (giftId) {
    const { data: gift } = await supabase
      .from("gifts")
      .select("id, is_active, wedding_id")
      .eq("id", giftId)
      .maybeSingle()

    if (!gift || !gift.is_active || gift.wedding_id !== wedding.id)
      return { error: "GIFT_NOT_FOUND" }
  }

  const grossCentimes = Math.round(grossAmountEuros * 100)
  const { fee, net } = computeFees(grossAmountEuros)
  const feeCentimes = Math.round(fee * 100)

  // 3. Créer la contribution en pending (source de vérité si webhook arrive avant redirect)
  const { data: contribution, error: dbError } = await supabase
    .from("contributions")
    .insert({
      wedding_id: wedding.id,
      gift_id: giftId ?? null,
      guest_name: guestName,
      guest_email: guestEmail || null,
      guest_message: guestMessage || null,
      contributor_photo_url: contributorPhotoUrl ?? null,
      gross_amount: grossAmountEuros,
      fee_amount: fee,
      net_amount: net,
      payment_status: "pending",
      is_anonymous: isAnonymous,
    })
    .select("id")
    .single()

  if (dbError ?? !contribution) {
    console.error("[createPaymentIntent] DB:", dbError?.message)
    return { error: "DB_ERROR" }
  }

  // 4. Créer le PaymentIntent Stripe avec destination charge
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: grossCentimes,
      currency: "eur",
      automatic_payment_methods: { enabled: true },
      application_fee_amount: feeCentimes,
      transfer_data: { destination: wedding.stripe_account_id },
      metadata: {
        contribution_id: contribution.id,
        wedding_id: wedding.id,
        gift_id: giftId ?? "",
      },
      description: `Contribution mariage ${wedding.partner1_first_name} & ${wedding.partner2_first_name}`,
      receipt_email: guestEmail || undefined,
    })

    // 5. Lier le PaymentIntent à la contribution
    await supabase
      .from("contributions")
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq("id", contribution.id)

    return {
      data: {
        clientSecret: paymentIntent.client_secret!,
        contributionId: contribution.id,
      },
    }
  } catch (err) {
    // Rollback la contribution pending si Stripe échoue
    const { error: rollbackError } = await supabase
      .from("contributions")
      .delete()
      .eq("id", contribution.id)
    if (rollbackError) {
      console.error("[createPaymentIntent_rollback] ORPHAN contribution pending — nettoyage manuel requis", {
        contributionId: contribution.id,
        weddingId: wedding.id,
        giftId: giftId ?? null,
        rollbackCode: rollbackError.code,
        rollbackMessage: rollbackError.message,
      })
    }
    console.error("[createPaymentIntent] Stripe:", err)
    return { error: "STRIPE_ERROR" }
  }
}
