import { createClient } from "@supabase/supabase-js"
import { auth } from "@clerk/nextjs/server"
import { env } from "@/lib/env"
import type { Database } from "./types"

// Prérequis Supabase dashboard (une seule fois) :
//   Authentication → Third-Party Auth → Add provider → type "Clerk"
//   JWKS URL : https://<your-clerk-domain>.clerk.accounts.dev/.well-known/jwks.json
//
// Prérequis Clerk dashboard (une seule fois) :
//   JWT Templates → New template → nom "supabase"
//   Claims : { "role": "authenticated" }
//   (le "sub" = Clerk user ID est automatiquement présent dans tout JWT Clerk)

export async function createClerkSupabaseClient() {
  const { getToken } = await auth()
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      accessToken: () => getToken({ template: "supabase" }),
      auth: { persistSession: false, autoRefreshToken: false },
    }
  )
}
