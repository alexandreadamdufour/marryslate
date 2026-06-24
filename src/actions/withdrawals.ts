"use server"

import { auth, currentUser } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { createAdminClient } from "@/lib/supabase/admin"
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

  const supabase = createAdminClient()

  const { data: user } = await supabase
    .from("users")
    .select("id, email, stripe_account_id, kyc_status")
    .eq("clerk_user_id", clerkUserId)
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

  return { user, wedding }
}

export async function setupStripeConnect(): Promise<ActionResult<{ onboardingUrl: string }>> {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return { error: "UNAUTHORIZED" }

  const clerkUser = await currentUser()
  if (!clerkUser) return { error: "UNAUTHORIZED" }

  const supabase = createAdminClient()

  const { data: user, error: userDbError } = await supabase
    .from("users")
    .select("id, email, stripe_account_id")
    .eq("clerk_user_id", clerkUserId)
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

export async function requestPayout(amountEuros: number): Promise<ActionResult<{ payoutId: string }>> {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return { error: "UNAUTHORIZED" }

  const ctx = await getAuthenticatedUserAndWedding()
  if (!ctx) return { error: "UNAUTHORIZED" }
  const { user, wedding } = ctx

  const stripeAccountId = user.stripe_account_id ?? wedding?.stripe_account_id
  if (!stripeAccountId) return { error: "STRIPE_NOT_CONFIGURED" }

  const amountCentimes = Math.round(amountEuros * 100)
  if (amountCentimes < 100) return { error: "AMOUNT_TOO_LOW" } // minimum 1 €

  // Vérifier le solde disponible
  const balanceCentimes = await getAccountBalance(stripeAccountId)
  if (amountCentimes > balanceCentimes) return { error: "INSUFFICIENT_BALANCE" }

  const payoutId = await createPayout(stripeAccountId, amountCentimes)

  // Créer l'entrée withdrawal
  const supabase = createAdminClient()
  await supabase.from("withdrawals").insert({
    wedding_id: wedding!.id,
    amount: amountEuros,
    stripe_payout_id: payoutId,
    status: "processing",
  })

  revalidatePath("/dashboard/retrait")
  return { data: { payoutId } }
}
