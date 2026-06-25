import { kv } from "@vercel/kv"

const RSVP_LIMIT = 3
const RSVP_WINDOW_SECONDS = 3600 // 1 heure

/**
 * Vérifie le rate limit RSVP : 3 soumissions par IP par mariage par heure.
 * Retourne `true` si la requête est autorisée, `false` si la limite est atteinte.
 * Passe silencieusement si Vercel KV n'est pas configuré (dev local).
 */
export async function checkRsvpRateLimit(ip: string, weddingId: string): Promise<boolean> {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return true

  const key = `rsvp:${ip}:${weddingId}`
  const count = await kv.incr(key)
  if (count === 1) {
    await kv.expire(key, RSVP_WINDOW_SECONDS)
  }
  return count <= RSVP_LIMIT
}
