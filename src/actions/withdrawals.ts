"use server"

import { z } from "zod"
import { auth, currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { createClerkSupabaseClient } from "@/lib/supabase/clerk-client"
import {
  createConnectedAccount,
  createOnboardingLink,
  getAccountBalance,
  createPayout,
} from "@/lib/stripe/connect"

type ActionResult<T = void> =
  | { data: T; error?: never }
  | { error: string; data?: never }

async function getAuthenticatedUserAndWedding() {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return null

  const supabase = await createClerkSupabaseClient()

  const { data: user } = await supabase
    .from("users")
    .select("id, email, stripe_account_id, kyc_status")
    .eq("clerk_user_id", clerkUserId)
    .is("deleted_at", null)
    .maybeSingle()

  if (!user) return null

  const { data: coowner } = await supabase
    .from("wedding_coowners")
    .select("wedding_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle()

  if (!coowner) return null

  const { data: wedding } = await supabase
    .from("weddings")
    .select("id, slug, stripe_account_id, partner1_first_name, partner2_first_name")
    .eq("id", coowner.wedding_id)
    .maybeSingle()

  return { user, wedding, supabase }
}

export async function setupStripeConnect(): Promise<ActionResult<{ onboardingUrl: string }>> {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return { error: "UNAUTHORIZED" }

  const clerkUser = await currentUser()
  if (!clerkUser) return { error: "UNAUTHORIZED" }

  const supabase = await createClerkSupabaseClient()

  const { data: user, error: userDbError } = await supabase
    .from("users")
    .select("id, email, stripe_account_id")
    .eq("clerk_user_id", clerkUserId)
    .is("deleted_at", null)
    .maybeSingle()

  if (userDbError) {
    console.error("[setupStripeConnect] DB user lookup:", userDbError.message, userDbError.code)
    // Colonne stripe_account_id absente = migration non appliquée
    if (userDbError.code === "42703") return { error: "MIGRATION_NOT_APPLIED" }
    return { error: "DB_ERROR" }
  }
  if (!user) return { error: "USER_NOT_FOUND" }

  let stripeAccountId = user.stripe_account_id

  if (!stripeAccountId) {
    const email = clerkUser.emailAddresses[0]?.emailAddress ?? user.email

    try {
      stripeAccountId = await createConnectedAccount(email)
    } catch (err) {
      console.error("[setupStripeConnect] Stripe createConnectedAccount:", err)
      return { error: "STRIPE_API_ERROR" }
    }

    const { error: updateUserError } = await supabase
      .from("users")
      .update({ stripe_account_id: stripeAccountId })
      .eq("id", user.id)

    if (updateUserError) {
      console.error("[setupStripeConnect] DB update user:", updateUserError.message)
    }

    const { data: coowner } = await supabase
      .from("wedding_coowners")
      .select("wedding_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle()

    if (coowner) {
      await supabase
        .from("weddings")
        .update({ stripe_account_id: stripeAccountId })
        .eq("id", coowner.wedding_id)
    }
  }

  try {
    const onboardingUrl = await createOnboardingLink(stripeAccountId)
    return { data: { onboardingUrl } }
  } catch (err) {
    console.error("[setupStripeConnect] Stripe createOnboardingLink:", err)
    return { error: "STRIPE_API_ERROR" }
  }
}

export async function requestPayout(
  amountEuros: number,
  idempotencyToken: string
): Promise<ActionResult<{ payoutId: string }>> {
  const schema = z.object({
    amountEuros: z.number().finite().positive().min(1).max(50000),
    idempotencyToken: z.string().uuid(),
  })
  const parsed = schema.safeParse({ amountEuros, idempotencyToken })
  if (!parsed.success) return { error: "INVALID_INPUT" }

  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return { error: "UNAUTHORIZED" }

  const ctx = await getAuthenticatedUserAndWedding()
  if (!ctx) return { error: "UNAUTHORIZED" }
  const { user, wedding, supabase } = ctx

  if (!wedding) return { error: "NO_WEDDING" }

  const stripeAccountId = user.stripe_account_id ?? wedding.stripe_account_id
  if (!stripeAccountId) return { error: "STRIPE_NOT_CONFIGURED" }

  const amountCentimes = Math.round(parsed.data.amountEuros * 100)
  if (amountCentimes < 100) return { error: "AMOUNT_TOO_LOW" }

  const balanceCentimes = await getAccountBalance(stripeAccountId)
  if (amountCentimes > balanceCentimes) return { error: "INSUFFICIENT_BALANCE" }

  // Défense 1 — blocage si un retrait est déjà en cours pour ce mariage
  const { data: pending } = await supabase
    .from("withdrawals")
    .select("id")
    .eq("wedding_id", wedding.id)
    .eq("status", "processing")
    .maybeSingle()
  if (pending) return { error: "PAYOUT_ALREADY_PENDING" }

  // Défense 2 — idempotency key stable pour cette intention de retrait
  let payoutId: string
  try {
    payoutId = await createPayout(
      stripeAccountId,
      amountCentimes,
      `retrait-${parsed.data.idempotencyToken}`
    )
  } catch (err) {
    console.error("[requestPayout] Stripe:", err)
    return { error: "STRIPE_API_ERROR" }
  }

  // Payout Stripe réussi — on doit absolument tracer le row. 3 tentatives.
  let lastInsertError = null
  for (let attempt = 1; attempt <= 3; attempt++) {
    const { error } = await supabase.from("withdrawals").insert({
      wedding_id: wedding.id,
      amount: parsed.data.amountEuros,
      stripe_payout_id: payoutId,
      status: "processing",
    })
    if (!error) { lastInsertError = null; break }
    // 23505 = stripe_payout_id déjà en base (race ou retry sur row existante) — succès
    if (error.code === "23505") { lastInsertError = null; break }
    lastInsertError = error
    if (attempt < 3) await new Promise(r => setTimeout(r, 200 * attempt))
  }

  if (lastInsertError) {
    console.error("[requestPayout] DB insert failed after 3 attempts — payout exists in Stripe", {
      payoutId,
      weddingId: wedding.id,
      amountEuros: parsed.data.amountEuros,
      code: lastInsertError.code,
      message: lastInsertError.message,
    })
    return { error: "PAYOUT_UNRECORDED" }
  }

  revalidatePath("/dashboard/retrait")
  return { data: { payoutId } }
}
