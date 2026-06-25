import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/types"

export async function assertWeddingCoowner(
  supabase: SupabaseClient<Database>,
  weddingId: string
): Promise<boolean> {
  const { data } = await supabase.rpc("is_wedding_coowner", { p_wedding_id: weddingId })
  return !!data
}
