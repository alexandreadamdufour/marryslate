import { Redis } from "@upstash/redis"

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    if (process.env.NODE_ENV === "production") {
      console.error("[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN manquant — rate limiting désactivé en prod")
    }
    return null
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
}

async function checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const redis = getRedis()
  if (!redis) return true
  const count = await redis.incr(key)
  if (count === 1) await redis.expire(key, windowSeconds)
  return count <= limit
}

/**
 * Résout l'IP cliente de façon fiable sur Vercel.
 * Priorité : x-real-ip (positionné par l'edge Vercel, non modifiable par le client)
 * puis dernier segment de x-forwarded-for (ajouté par le dernier proxy de confiance).
 * Ne prend JAMAIS le premier segment de x-forwarded-for (client-controlled, injectable).
 * Retourne null si l'IP ne peut pas être déterminée → les checks font fail-open sans bucket partagé.
 */
export function getClientIp(
  requestHeaders: { get: (key: string) => string | null }
): string | null {
  const realIp = requestHeaders.get("x-real-ip")?.trim()
  if (realIp) return realIp

  const forwarded = requestHeaders.get("x-forwarded-for")
  return forwarded?.split(",").at(-1)?.trim() ?? null
}

// null IP → fail-open immédiat, pas de clé Redis "null:..." jamais écrite

// 3 RSVP / IP / wedding / heure
export function checkRsvpRateLimit(ip: string | null, weddingId: string) {
  if (!ip) return Promise.resolve(true)
  return checkRateLimit(`rsvp:${ip}:${weddingId}`, 3, 3600)
}

// 5 messages / IP / wedding / heure — protège quota Resend (100 emails/jour)
export function checkGuestbookRateLimit(ip: string | null, weddingId: string) {
  if (!ip) return Promise.resolve(true)
  return checkRateLimit(`guestbook:${ip}:${weddingId}`, 5, 3600)
}

// 10 tentatives / IP / slug / 15 min — anti brute-force code PIN
export function checkAccessCodeRateLimit(ip: string | null, slug: string) {
  if (!ip) return Promise.resolve(true)
  return checkRateLimit(`access:${ip}:${slug}`, 10, 900)
}

// 5 PaymentIntents / IP / wedding / heure — protège Stripe + table contributions
export function checkPaymentIntentRateLimit(ip: string | null, weddingSlug: string) {
  if (!ip) return Promise.resolve(true)
  return checkRateLimit(`payment:${ip}:${weddingSlug}`, 5, 3600)
}

// 10 uploads / IP / wedding / heure — protège bucket Supabase Storage
export function checkPhotoUploadRateLimit(ip: string | null, weddingSlug: string) {
  if (!ip) return Promise.resolve(true)
  return checkRateLimit(`photo:${ip}:${weddingSlug}`, 10, 3600)
}
