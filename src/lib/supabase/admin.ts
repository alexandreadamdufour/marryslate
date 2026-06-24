import { createClient } from "@supabase/supabase-js"
import type { Database } from "./types"

// Service role — bypass RLS. Uniquement : webhooks, cron jobs, admin ops.
// Ne JAMAIS importer ce client côté client ou dans des composants accessibles au navigateur.
export function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
