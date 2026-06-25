import { headers } from "next/headers"
import type Stripe from "stripe"
import { stripe } from "@/lib/stripe/client"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendContributionReceipt, sendCoupleContributionNotif, sendPayoutNotif } from "@/lib/resend/send"

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) return new Response("Configuration manquante", { status: 500 })

  const body = await req.text()
  const headerPayload = await headers()
  const sig = headerPayload.get("stripe-signature")
  if (!sig) return new Response("Signature manquante", { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret)
  } catch {
    return new Response("Signature invalide", { status: 400 })
  }

  const supabase = createAdminClient()

  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent
      const contributionId = pi.metadata?.contribution_id
      if (!contributionId) break

      // Idempotence : vérifier si déjà traité
      const { data: existing } = await supabase
        .from("contributions")
        .select("id, payment_status, guest_email, guest_name, gift_id, gross_amount, net_amount, wedding_id, is_anonymous")
        .eq("id", contributionId)
        .maybeSingle()

      if (!existing || existing.payment_status === "succeeded") break

      await supabase
        .from("contributions")
        .update({ payment_status: "succeeded", stripe_payment_intent_id: pi.id })
        .eq("id", contributionId)

      // Recalcule current_amount depuis zéro (idempotent, cohérent avec le trigger DB)
      const giftId = existing.gift_id ?? pi.metadata?.gift_id ?? null
      if (giftId) {
        const { data: rows } = await supabase
          .from("contributions")
          .select("net_amount")
          .eq("gift_id", giftId)
          .eq("payment_status", "succeeded")

        const total = rows?.reduce((sum, r) => sum + Number(r.net_amount), 0) ?? 0

        const { error: giftUpdateError } = await supabase
          .from("gifts")
          .update({ current_amount: total })
          .eq("id", giftId)

        if (giftUpdateError) {
          console.error("[webhook] gift current_amount update:", giftUpdateError.message)
        }
      }

      // Récupérer infos pour les emails
      const { data: wedding } = await supabase
        .from("weddings")
        .select("partner1_first_name, partner2_first_name, slug, owner_id, notifications_enabled")
        .eq("id", existing.wedding_id)
        .maybeSingle()

      const giftTitle = existing.gift_id
        ? (await supabase.from("gifts").select("title").eq("id", existing.gift_id).maybeSingle())
            .data?.title ?? null
        : null

      // Email de reçu à l'invité
      if (existing.guest_email && !existing.is_anonymous) {
        await sendContributionReceipt({
          guestEmail: existing.guest_email,
          guestName: existing.guest_name,
          giftTitle,
          grossAmount: Math.round(Number(existing.gross_amount) * 100),
          weddingPartner1: wedding?.partner1_first_name ?? "",
          weddingPartner2: wedding?.partner2_first_name ?? "",
          weddingSlug: wedding?.slug ?? "",
        }).catch((e) => console.error("[webhook] receipt email:", e))
      }

      // Notification au couple (respecte la préférence)
      if (wedding?.owner_id && wedding.notifications_enabled) {
        const { data: owner } = await supabase
          .from("users")
          .select("email")
          .eq("id", wedding.owner_id)
          .maybeSingle()

        if (owner?.email) {
          await sendCoupleContributionNotif({
            coupleEmail: owner.email,
            guestName: existing.is_anonymous ? "Un invité anonyme" : existing.guest_name,
            giftTitle,
            netAmount: Math.round(Number(existing.net_amount) * 100),
            grossAmount: Math.round(Number(existing.gross_amount) * 100),
            weddingPartner1: wedding.partner1_first_name,
            weddingPartner2: wedding.partner2_first_name,
          }).catch((e) => console.error("[webhook] couple notif email:", e))
        }
      }
      break
    }

    case "payment_intent.payment_failed": {
      const pi = event.data.object as Stripe.PaymentIntent
      const contributionId = pi.metadata?.contribution_id
      if (!contributionId) break

      await supabase
        .from("contributions")
        .update({ payment_status: "failed" })
        .eq("id", contributionId)
        .eq("payment_status", "pending") // idempotence
      break
    }

    case "payment_intent.canceled": {
      const pi = event.data.object as Stripe.PaymentIntent
      const contributionId = pi.metadata?.contribution_id
      if (!contributionId) break

      await supabase
        .from("contributions")
        .update({ payment_status: "failed" })
        .eq("id", contributionId)
        .eq("payment_status", "pending") // idempotence
      break
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge
      const piId =
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id
      if (!piId) break

      const { data: contribution } = await supabase
        .from("contributions")
        .select("id, gift_id, payment_status")
        .eq("stripe_payment_intent_id", piId)
        .maybeSingle()

      if (!contribution || contribution.payment_status === "refunded") break

      await supabase
        .from("contributions")
        .update({ payment_status: "refunded" })
        .eq("id", contribution.id)

      // Recalculer current_amount en excluant la contribution remboursée
      if (contribution.gift_id) {
        const { data: rows } = await supabase
          .from("contributions")
          .select("net_amount")
          .eq("gift_id", contribution.gift_id)
          .eq("payment_status", "succeeded")

        const total = rows?.reduce((sum, r) => sum + Number(r.net_amount), 0) ?? 0

        await supabase
          .from("gifts")
          .update({ current_amount: total })
          .eq("id", contribution.gift_id)
      }
      break
    }

    case "account.application.deauthorized": {
      const connectedAccountId = event.account
      if (!connectedAccountId) break

      await Promise.all([
        supabase
          .from("users")
          .update({ stripe_account_id: null, kyc_status: "not_started" })
          .eq("stripe_account_id", connectedAccountId),
        supabase
          .from("weddings")
          .update({ stripe_account_id: null })
          .eq("stripe_account_id", connectedAccountId),
      ])
      break
    }

    case "account.updated": {
      const account = event.data.object as Stripe.Account
      const kyc_status = account.charges_enabled
        ? "validated"
        : account.details_submitted
          ? "pending"
          : "not_started"

      await supabase
        .from("users")
        .update({ kyc_status })
        .eq("stripe_account_id", account.id)
      break
    }

    case "payout.paid": {
      const payout = event.data.object as Stripe.Payout

      const { data: withdrawal } = await supabase
        .from("withdrawals")
        .select("id, amount, wedding_id")
        .eq("stripe_payout_id", payout.id)
        .maybeSingle()

      if (!withdrawal) break

      await supabase
        .from("withdrawals")
        .update({ status: "succeeded", processed_at: new Date().toISOString() })
        .eq("id", withdrawal.id)

      // Email de confirmation
      const { data: wedding } = await supabase
        .from("weddings")
        .select("owner_id, partner1_first_name, partner2_first_name")
        .eq("id", withdrawal.wedding_id)
        .maybeSingle()

      if (wedding?.owner_id) {
        const { data: owner } = await supabase
          .from("users")
          .select("email")
          .eq("id", wedding.owner_id)
          .maybeSingle()

        if (owner?.email) {
          await sendPayoutNotif({
            coupleEmail: owner.email,
            amountCentimes: Math.round(Number(withdrawal.amount) * 100),
            weddingPartner1: wedding.partner1_first_name,
            weddingPartner2: wedding.partner2_first_name,
          }).catch((e) => console.error("[webhook] payout email:", e))
        }
      }
      break
    }

    case "payout.failed": {
      const payout = event.data.object as Stripe.Payout
      await supabase
        .from("withdrawals")
        .update({ status: "failed" })
        .eq("stripe_payout_id", payout.id)
      break
    }
  }

  return new Response("OK", { status: 200 })
}
