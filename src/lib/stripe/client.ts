import Stripe from "stripe"

// Singleton server-side — jamais importé côté client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia",
  typescript: true,
})
