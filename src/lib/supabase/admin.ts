import { createClient } from "@supabase/supabase-js"
import { env } from "@/lib/env"
import type { Database } from "./types"

// Service role — bypass RLS. Uniquement : webhooks, cron jobs, admin ops.
// Ne JAMAIS importer ce client côté client ou dans des composants accessibles au navigateur.
export function createAdminClient() {
  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
