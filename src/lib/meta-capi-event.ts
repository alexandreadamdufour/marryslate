import { env } from "@/lib/env"

/**
 * Envoie un event Meta Conversions API (CAPI) depuis un contexte serveur
 * (webhook Stripe) — pas de contexte navigateur pour fbq. Calque de
 * sendGA4ServerEvent (@/lib/ga4-server-event) : même limitation, pas
 * d'IP/user-agent du visiteur d'origine disponible dans un webhook
 * server-to-server, donc match quality réduite (event compté mais moins
 * bien attribué qu'un fbq client). No-op silencieux si
 * NEXT_PUBLIC_META_PIXEL_ID ou META_CAPI_ACCESS_TOKEN absent.
 */
export async function sendMetaCapiEvent(
  eventName: string,
  customData: Record<string, string | number> = {}
): Promise<void> {
  const pixelId = env.NEXT_PUBLIC_META_PIXEL_ID
  const accessToken = env.META_CAPI_ACCESS_TOKEN
  if (!pixelId || !accessToken) return

  try {
    await fetch(`https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${accessToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [
          {
            event_name: eventName,
            event_time: Math.floor(Date.now() / 1000),
            action_source: "website",
            custom_data: customData,
          },
        ],
      }),
    })
  } catch (e) {
    console.error(`[meta-capi] event ${eventName}:`, e)
  }
}
