import { stripe } from "./client"
import { env } from "@/lib/env"

export type StripeAccountStatus = "not_created" | "onboarding" | "active" | "restricted"

export async function createConnectedAccount(email: string): Promise<string> {
  const account = await stripe.accounts.create({
    type: "express",
    country: "FR",
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    settings: {
      payouts: {
        // Paiements manuels par défaut — le couple déclenche ses retraits
        schedule: { interval: "manual" },
      },
    },
  })
  return account.id
}

export async function createOnboardingLink(
  stripeAccountId: string,
  returnPath = "/dashboard/retrait"
): Promise<string> {
  const baseUrl = env.NEXT_PUBLIC_APP_URL
  const accountLink = await stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: `${baseUrl}${returnPath}?refresh=true`,
    return_url: `${baseUrl}${returnPath}?onboarding=complete`,
    type: "account_onboarding",
  })
  return accountLink.url
}

export async function getAccountStatus(
  stripeAccountId: string
): Promise<{ status: StripeAccountStatus; chargesEnabled: boolean; detailsSubmitted: boolean }> {
  const account = await stripe.accounts.retrieve(stripeAccountId)
  let status: StripeAccountStatus = "not_created"

  if (account.charges_enabled) {
    status = "active"
  } else if (account.details_submitted) {
    status = "restricted"
  } else {
    status = "onboarding"
  }

  return {
    status,
    chargesEnabled: account.charges_enabled,
    detailsSubmitted: account.details_submitted ?? false,
  }
}

export async function getAccountBalance(stripeAccountId: string): Promise<number> {
  const balance = await stripe.balance.retrieve(
    {},
    { stripeAccount: stripeAccountId }
  )
  const available = balance.available.find((b) => b.currency === "eur")
  return available ? available.amount : 0 // in centimes
}

export async function createPayout(
  stripeAccountId: string,
  amountCentimes: number,
  idempotencyKey?: string
): Promise<string> {
  const payout = await stripe.payouts.create(
    { amount: amountCentimes, currency: "eur" },
    {
      stripeAccount: stripeAccountId,
      ...(idempotencyKey && { idempotencyKey }),
    }
  )
  return payout.id
}
