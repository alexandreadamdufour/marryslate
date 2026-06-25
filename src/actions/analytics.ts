"use server"

import { cookies } from "next/headers"
import { createAdminClient } from "@/lib/supabase/admin"

export async function trackWeddingView(slug: string): Promise<void> {
  if (!slug) return

  const cookieName = `amora_viewed_${slug}`
  const cookieStore = await cookies()

  // Already counted this browser session — skip
  if (cookieStore.has(cookieName)) return

  const supabase = createAdminClient()
  await supabase.rpc("increment_wedding_view_count", { p_slug: slug })

  // Session cookie (no maxAge) — cleared when browser closes
  cookieStore.set(cookieName, "1", {
    httpOnly: true,
    path: `/m/${slug}`,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })
}
