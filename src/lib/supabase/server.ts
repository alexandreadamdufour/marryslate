import { createServerClient as _createServerClient } from "@supabase/ssr"
import type { CookieOptions } from "@supabase/ssr"
import { SupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import type { Database } from "./types"

export type TypedSupabaseClient = SupabaseClient<Database>

export async function createServerClient(): Promise<TypedSupabaseClient> {
  const cookieStore = await cookies()

  return _createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // setAll peut être appelé depuis un Server Component — on ignore l'erreur
          }
        },
      },
    }
  ) as unknown as TypedSupabaseClient
}
