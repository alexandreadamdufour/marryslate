import { createAdminClient } from "@/lib/supabase/admin"

export async function assertWeddingCoowner(
  clerkUserId: string,
  weddingId: string
): Promise<boolean> {
  const supabase = createAdminClient()

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", clerkUserId)
    .maybeSingle()

  if (!user) return false

  const { data } = await supabase
    .from("wedding_coowners")
    .select("wedding_id")
    .eq("wedding_id", weddingId)
    .eq("user_id", user.id)
    .maybeSingle()

  return !!data
}
