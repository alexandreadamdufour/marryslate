import { describe, it, expect } from "vitest"
import { withBookingAffiliate } from "@/lib/booking-affiliate"

describe("withBookingAffiliate", () => {
  it("injecte aid sur une URL booking.com", () => {
    expect(withBookingAffiliate("https://www.booking.com/hotel/fr/le-manoir.html", "123456")).toBe(
      "https://www.booking.com/hotel/fr/le-manoir.html?aid=123456"
    )
  })

  it("remplace aid si déjà présent", () => {
    expect(withBookingAffiliate("https://booking.com/hotel?aid=999", "123456")).toBe(
      "https://booking.com/hotel?aid=123456"
    )
  })

  it("gère les sous-domaines (secure.booking.com)", () => {
    expect(withBookingAffiliate("https://secure.booking.com/book.html", "123456")).toContain(
      "aid=123456"
    )
  })

  it("ne touche pas une URL non-booking.com", () => {
    const url = "https://www.hotel-independant.fr/reserver"
    expect(withBookingAffiliate(url, "123456")).toBe(url)
  })

  it("no-op si aid absent", () => {
    const url = "https://www.booking.com/hotel/fr/le-manoir.html"
    expect(withBookingAffiliate(url, undefined)).toBe(url)
  })

  it("no-op si URL invalide", () => {
    expect(withBookingAffiliate("pas-une-url", "123456")).toBe("pas-une-url")
  })
})
