/**
 * Injecte le tag d'affiliation Booking Partner Network dans une URL
 * booking.com. No-op (URL inchangée) si l'AID est absent ou si l'URL ne
 * pointe pas vers booking.com — évite de taguer un lien vers un hôtel
 * indépendant collé dans le même champ.
 */
export function withBookingAffiliate(url: string, aid: string | undefined): string {
  if (!aid || !url) return url

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return url
  }

  const hostname = parsed.hostname.toLowerCase()
  const isBooking = hostname === "booking.com" || hostname.endsWith(".booking.com")
  if (!isBooking) return url

  parsed.searchParams.set("aid", aid)
  return parsed.toString()
}
