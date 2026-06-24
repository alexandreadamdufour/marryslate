import { describe, it, expect } from "vitest"
import { createWeddingSchema, updateWeddingSchema } from "@/lib/validators/wedding"

describe("createWeddingSchema", () => {
  it("valide un input correct", () => {
    const result = createWeddingSchema.safeParse({
      partner1FirstName: "Sophie",
      partner2FirstName: "Thomas",
      slug: "sophie-et-thomas",
    })
    expect(result.success).toBe(true)
  })

  it("rejette un slug avec majuscules", () => {
    const result = createWeddingSchema.safeParse({
      partner1FirstName: "Sophie",
      partner2FirstName: "Thomas",
      slug: "Sophie-Thomas",
    })
    expect(result.success).toBe(false)
  })

  it("rejette un slug trop court", () => {
    const result = createWeddingSchema.safeParse({
      partner1FirstName: "A",
      partner2FirstName: "B",
      slug: "ab",
    })
    expect(result.success).toBe(false)
  })

  it("rejette des prénoms vides", () => {
    const result = createWeddingSchema.safeParse({
      partner1FirstName: "",
      partner2FirstName: "Thomas",
      slug: "test-slug",
    })
    expect(result.success).toBe(false)
  })
})

describe("updateWeddingSchema", () => {
  it("valide une mise à jour partielle", () => {
    const result = updateWeddingSchema.safeParse({
      weddingId: "550e8400-e29b-41d4-a716-446655440000",
      partner1FirstName: "Sophie",
    })
    expect(result.success).toBe(true)
  })

  it("rejette un weddingId non-UUID", () => {
    const result = updateWeddingSchema.safeParse({
      weddingId: "not-a-uuid",
    })
    expect(result.success).toBe(false)
  })
})
