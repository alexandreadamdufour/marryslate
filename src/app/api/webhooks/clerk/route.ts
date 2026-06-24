import { headers } from "next/headers"
import { Webhook } from "svix"
import { createAdminClient } from "@/lib/supabase/admin"

type ClerkWebhookEvent =
  | { type: "user.created"; data: { id: string; email_addresses: Array<{ email_address: string }>; first_name: string | null; last_name: string | null } }
  | { type: "user.updated"; data: { id: string; email_addresses: Array<{ email_address: string }>; first_name: string | null; last_name: string | null } }
  | { type: "user.deleted"; data: { id: string; deleted: boolean } }

export async function POST(req: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET
  if (!secret) return new Response("Configuration manquante", { status: 500 })

  const headerPayload = await headers()
  const svixId = headerPayload.get("svix-id")
  const svixTimestamp = headerPayload.get("svix-timestamp")
  const svixSignature = headerPayload.get("svix-signature")

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Headers svix manquants", { status: 400 })
  }

  const body = await req.text()
  const wh = new Webhook(secret)
  let event: ClerkWebhookEvent

  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkWebhookEvent
  } catch {
    return new Response("Signature invalide", { status: 400 })
  }

  const supabase = createAdminClient()

  if (event.type === "user.created") {
    const { id, email_addresses, first_name, last_name } = event.data
    const email = email_addresses[0]?.email_address ?? ""
    const displayName = [first_name, last_name].filter(Boolean).join(" ") || null

    const { error } = await supabase.from("users").insert({
      clerk_user_id: id,
      email,
      display_name: displayName,
      role: "couple",
      kyc_status: "not_started",
    })

    if (error) {
      console.error("[clerk/webhook] user.created error:", error.message)
      return new Response("Erreur DB", { status: 500 })
    }
  }

  if (event.type === "user.updated") {
    const { id, email_addresses, first_name, last_name } = event.data
    const email = email_addresses[0]?.email_address ?? ""
    const displayName = [first_name, last_name].filter(Boolean).join(" ") || null

    await supabase
      .from("users")
      .update({ email, display_name: displayName })
      .eq("clerk_user_id", id)
  }

  if (event.type === "user.deleted") {
    // Soft delete : on garde le user pour ne pas casser les contributions
    await supabase
      .from("users")
      .update({ role: "couple" })
      .eq("clerk_user_id", event.data.id)
  }

  return new Response("OK", { status: 200 })
}
