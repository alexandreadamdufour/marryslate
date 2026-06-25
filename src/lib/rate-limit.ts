import { Redis } from "@upstash/redis"

const RSVP_LIMIT = 3
const RSVP_WINDOW_SECONDS = 3600 // 1 heure

/**
 * Vérifie le rate limit RSVP : 3 soumissions par IP par mariage par heure.
 * Retourne `true` si la requête est autorisée, `false` si la limite est atteinte.
 * Passe silencieusement si Upstash Redis n'est pas configuré (dev local).
 */
export async function checkRsvpRateLimit(ip: string, weddingId: string): Promise<boolean> {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return true

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })

  const key = `rsvp:${ip}:${weddingId}`
  const count = await redis.incr(key)
  if (count === 1) {
    await redis.expire(key, RSVP_WINDOW_SECONDS)
  }
  return count <= RSVP_LIMIT
}
