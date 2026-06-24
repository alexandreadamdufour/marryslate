import { z } from "zod"

const envSchema = z.object({
  // Public
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  // Private
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  MANGOPAY_CLIENT_ID: z.string().min(1),
  MANGOPAY_API_KEY: z.string().min(1),
  MANGOPAY_BASE_URL: z.string().url(),
  MANGOPAY_WEBHOOK_SECRET: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
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
