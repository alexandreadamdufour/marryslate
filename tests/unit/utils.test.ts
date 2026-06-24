import { describe, it, expect } from "vitest"
import { slugify, computeFee } from "@/lib/utils"

describe("slugify", () => {
  it("lowercase et tirets", () => {
    expect(slugify("Sophie et Thomas")).toBe("sophie-et-thomas")
  })
  it("supprime les accents", () => {
    expect(slugify("léa & côme")).toBe("lea-come")
  })
  it("supprime les caractères spéciaux", () => {
    expect(slugify("Marie-Claire & François!")).toBe("marie-claire-francois")
  })
  it("déduplique les tirets", () => {
    expect(slugify("  bonjour   monde  ")).toBe("bonjour-monde")
  })
})

describe("computeFee", () => {
  it("calcule la commission 2.9% + 0.30€", () => {
    const { fee, net } = computeFee(100)
    expect(fee).toBe(3.2)
    expect(net).toBe(96.8)
    expect(fee + net).toBeCloseTo(100, 5)
  })
  it("arrondit à 2 décimales", () => {
    const { fee, net } = computeFee(50)
    expect(fee + net).toBeCloseTo(50, 5)
  })
})
