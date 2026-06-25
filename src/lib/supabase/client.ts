import { createBrowserClient as _createBrowserClient } from "@supabase/ssr"
import type { Database } from "./types"

export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY manquant")
  }
  return _createBrowserClient<Database>(url, key)
}
