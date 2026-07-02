import { z } from "zod"

const envSchema = z.object({
  // Public
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_GA_ID: z.string().optional(),
  NEXT_PUBLIC_CRISP_WEBSITE_ID: z.string().optional(),
  // DSN Sentry — pas un secret (safe à exposer), doit être NEXT_PUBLIC_ pour
  // que instrumentation-client.ts (browser) puisse le lire.
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  // Affiliate ID Booking Partner Network — pas un secret (apparaît en clair
  // dans les URLs rendues côté public), no-op tant qu'absent.
  NEXT_PUBLIC_BOOKING_AID: z.string().optional(),
  // Meta Pixel ID — pas un secret (visible dans le HTML/network tab).
  NEXT_PUBLIC_META_PIXEL_ID: z.string().optional(),
  // Google Ads — pas des secrets non plus (mêmes raisons que GA_ID/AID).
  NEXT_PUBLIC_GOOGLE_ADS_ID: z.string().optional(),
  NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL: z.string().optional(),
  // Private
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_WEBHOOK_SECRET_CONNECT: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  // GA4 Measurement Protocol — événements serveur (webhook Stripe, pas de
  // contexte navigateur pour sendGAEvent). VRAI secret contrairement au DSN/
  // AID : quiconque le possède peut injecter des events arbitraires dans la
  // propriété GA4. Généré dans GA4 Admin → Data Streams → flux web →
  // Measurement Protocol API secrets.
  GA_MEASUREMENT_PROTOCOL_API_SECRET: z.string().optional(),
  // Meta Conversions API — VRAI secret (permet d'injecter des events
  // arbitraires dans le compte pub Meta). Généré dans Events Manager →
  // Conversions API → Generate Access Token.
  META_CAPI_ACCESS_TOKEN: z.string().optional(),
  // Build-time uniquement (upload source maps) — lu directement via
  // process.env dans next.config.ts, jamais par l'app runtime. Présent ici
  // pour documentation/complétude avec .env.local.example.
  SENTRY_AUTH_TOKEN: z.string().optional(),
  // Upstash Redis — rate limiting (optionnel en local, requis en production)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
})

export type Env = z.infer<typeof envSchema>

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    console.error("❌ Variables d'environnement invalides:")
    console.error(parsed.error.flatten().fieldErrors)
    throw new Error("Configuration d'environnement invalide. Voir les logs.")
  }
  return parsed.data
}

export const env = validateEnv()
