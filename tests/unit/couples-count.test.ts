import { describe, it, expect } from "vitest"
import { getCouplesCount } from "@/lib/couples-count"

const LAUNCH_DATE = new Date("2026-06-24T00:00:00Z")

function daysAfterLaunch(days: number): Date {
  return new Date(LAUNCH_DATE.getTime() + days * 86_400_000)
}

describe("getCouplesCount", () => {
  it("retourne exactement 127 au jour 0 (date d'ancrage)", () => {
    expect(getCouplesCount(LAUNCH_DATE)).toBe(127)
  })

  it("retourne 131 après 10 jours (valeur de référence calculée)", () => {
    expect(getCouplesCount(daysAfterLaunch(10))).toBe(131)
  })

  it("retourne 137 après 30 jours (valeur de référence calculée)", () => {
    expect(getCouplesCount(daysAfterLaunch(30))).toBe(137)
  })

  it("ne redescend jamais d'un jour à l'autre sur 90 jours (croissance strictement monotone)", () => {
    let previous = getCouplesCount(daysAfterLaunch(0))
    for (let day = 1; day <= 90; day++) {
      const current = getCouplesCount(daysAfterLaunch(day))
      expect(current).toBeGreaterThanOrEqual(previous)
      previous = current
    }
  })

  it("est déterministe : appeler plusieurs fois avec la même date donne le même résultat", () => {
    const date = daysAfterLaunch(30)
    expect(getCouplesCount(date)).toBe(getCouplesCount(date))
  })

  it("retourne la base (127) pour une date antérieure à l'ancrage", () => {
    const before = new Date(LAUNCH_DATE.getTime() - 86_400_000)
    expect(getCouplesCount(before)).toBe(127)
  })
})
