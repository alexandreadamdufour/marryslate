import { env } from "@/lib/env"

/**
 * Envoie un événement GA4 depuis un contexte serveur (webhook, cron) où
 * sendGAEvent (client-only, dataLayer navigateur) ne peut pas fonctionner.
 * client_id généré aléatoirement à chaque appel : pas de session utilisateur
 * à rattacher côté serveur, l'event compte pour le funnel/les rapports mais
 * ne se fusionne pas avec le parcours de navigation de l'utilisateur.
 * No-op silencieux si NEXT_PUBLIC_GA_ID ou GA_MEASUREMENT_PROTOCOL_API_SECRET
 * absent (dev local, ou avant que le secret soit posé sur Vercel).
 */
export async function sendGA4ServerEvent(
  eventName: string,
  params: Record<string, string | number> = {}
): Promise<void> {
  const measurementId = env.NEXT_PUBLIC_GA_ID
  const apiSecret = env.GA_MEASUREMENT_PROTOCOL_API_SECRET
  if (!measurementId || !apiSecret) return

  try {
    await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
      {
        method: "POST",
        body: JSON.stringify({
          client_id: crypto.randomUUID(),
          events: [{ name: eventName, params }],
        }),
      }
    )
  } catch (e) {
    console.error(`[ga4] server event ${eventName}:`, e)
  }
}
