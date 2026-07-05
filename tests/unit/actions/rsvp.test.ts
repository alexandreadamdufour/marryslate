import { describe, it, expect, vi, beforeEach } from "vitest"
import { makeMockSupabase, type MockResult } from "../helpers/mock-supabase"

// --- Mocks de modules ---
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}))
vi.mock("@/lib/rate-limit", () => ({
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
  checkRsvpRateLimit: vi.fn().mockResolvedValue(true),
}))
vi.mock("@/lib/resend/send", () => ({
  sendRsvpConfirmationToGuest: vi.fn().mockResolvedValue(undefined),
  sendRsvpNotifToCouple: vi.fn().mockResolvedValue(undefined),
}))

// --- Imports après mocks ---
import { createAdminClient } from "@/lib/supabase/admin"
import { checkRsvpRateLimit } from "@/lib/rate-limit"
import { submitRsvp } from "@/actions/rsvp"

const mockCreateAdmin = vi.mocked(createAdminClient)
const mockRateLimit = vi.mocked(checkRsvpRateLimit)

// --- Fixtures ---
const WEDDING_ID = "550e8400-e29b-41d4-a716-446655440099"
const RSVP_ID = "rsvp-uuid-1"
const OWNER_ID = "owner-uuid-1"

const VALID_RSVP = {
  weddingId: WEDDING_ID,
  firstName: "Marie",
  lastName: "Dupont",
  email: "marie.dupont@test.com",
  attending: true,
  guestCount: 2,
}

/**
 * Ordre des appels from() dans submitRsvp :
 *   weddings[0]       → select mariage (is_published, rsvp_enabled, ...)
 *   rsvp_responses[0] → detectConflict: select réponses existantes (conflit)
 *   rsvp_responses[1] → insert RSVP
 *   users[0]          → select email owner (couple notif, si notifications_enabled)
 *   guests            → update rsvp_status (fire-and-forget, non awaitée — ignorée en tests)
 */
function makeDefaultRsvpSupabase(overrides: Record<string, MockResult[]> = {}) {
  return makeMockSupabase({
    weddings: [
      {
        data: {
          id: WEDDING_ID,
          is_published: true,
          rsvp_enabled: true,
          partner1_first_name: "Sophie",
          partner2_first_name: "Thomas",
          owner_id: OWNER_ID,
          slug: "sophie-et-thomas",
          notifications_enabled: false, // désactivé par défaut → pas d'appel users
        },
        error: null,
      },
    ],
    rsvp_responses: [
      { data: [], error: null }, // detectConflict: select réponses existantes (aucun conflit)
      { data: { id: RSVP_ID }, error: null }, // insert
    ],
    users: [{ data: { email: "couple@test.com" }, error: null }],
    ...overrides,
  })
}

describe("submitRsvp", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRateLimit.mockResolvedValue(true)
    mockCreateAdmin.mockReturnValue(makeDefaultRsvpSupabase().client as never)
  })

  // ─── Validation Zod ─────────────────────────────────────────────────────────

  describe("validation Zod", () => {
    it("rejette un input vide → INVALID_INPUT [casserait si Zod validation retirée]", async () => {
      const result = await submitRsvp({} as never)
      expect(result).toMatchObject({ error: "INVALID_INPUT" })
      expect(mockCreateAdmin).not.toHaveBeenCalled()
    })

    it("rejette un weddingId non-UUID → INVALID_INPUT [casserait si la validation UUID était supprimée]", async () => {
      const result = await submitRsvp({ ...VALID_RSVP, weddingId: "pas-un-uuid" })
      expect(result).toMatchObject({ error: "INVALID_INPUT" })
    })
  })

  // ─── Rate limiting ───────────────────────────────────────────────────────────

  describe("rate limiting", () => {
    it("retourne RATE_LIMITED si la limite IP/wedding est atteinte [casserait si checkRsvpRateLimit était retiré]", async () => {
      mockRateLimit.mockResolvedValue(false)
      const result = await submitRsvp(VALID_RSVP)
      expect(result).toEqual({ error: "RATE_LIMITED" })
      expect(mockCreateAdmin).not.toHaveBeenCalled()
    })
  })

  // ─── Disponibilité du RSVP ──────────────────────────────────────────────────

  describe("disponibilité RSVP", () => {
    it("retourne RSVP_NOT_AVAILABLE si le mariage n'est pas publié [casserait si le check is_published était retiré]", async () => {
      mockCreateAdmin.mockReturnValue(
        makeDefaultRsvpSupabase({
          weddings: [
            {
              data: {
                ...makeDefaultRsvpSupabase().client,
                id: WEDDING_ID,
                is_published: false,
                rsvp_enabled: true,
              },
              error: null,
            },
          ],
        }).client as never
      )
      // Reconstruction propre du mock wedding non publié
      const { client } = makeMockSupabase({
        weddings: [
          {
            data: {
              id: WEDDING_ID,
              is_published: false,
              rsvp_enabled: true,
              partner1_first_name: "Sophie",
              partner2_first_name: "Thomas",
              owner_id: OWNER_ID,
              slug: "s-et-t",
              notifications_enabled: false,
            },
            error: null,
          },
        ],
        rsvp_responses: [{ data: { id: RSVP_ID }, error: null }],
        users: [{ data: { email: "couple@test.com" }, error: null }],
      })
      mockCreateAdmin.mockReturnValue(client as never)

      const result = await submitRsvp(VALID_RSVP)
      expect(result).toEqual({ error: "RSVP_NOT_AVAILABLE" })
    })

    it("retourne RSVP_NOT_AVAILABLE si le RSVP est désactivé sur ce mariage [casserait si le check rsvp_enabled était retiré — bug distinct du check is_published]", async () => {
      const { client } = makeMockSupabase({
        weddings: [
          {
            data: {
              id: WEDDING_ID,
              is_published: true,
              rsvp_enabled: false,
              partner1_first_name: "Sophie",
              partner2_first_name: "Thomas",
              owner_id: OWNER_ID,
              slug: "s-et-t",
              notifications_enabled: false,
            },
            error: null,
          },
        ],
        rsvp_responses: [{ data: { id: RSVP_ID }, error: null }],
        users: [{ data: { email: "couple@test.com" }, error: null }],
      })
      mockCreateAdmin.mockReturnValue(client as never)

      const result = await submitRsvp(VALID_RSVP)
      expect(result).toEqual({ error: "RSVP_NOT_AVAILABLE" })
    })
  })

  // ─── Flow nominal ────────────────────────────────────────────────────────────

  describe("flow nominal", () => {
    it("insère la réponse et retourne { data: { id } } [casserait si l'insert rsvp_responses était cassé]", async () => {
      const result = await submitRsvp(VALID_RSVP)
      expect(result).toEqual({ data: { id: RSVP_ID } })
    })

    it("retourne { data: { id } } quand attending=false (invité décline) [casserait si attending=false n'était pas géré]", async () => {
      const result = await submitRsvp({ ...VALID_RSVP, attending: false })
      expect(result).toEqual({ data: { id: RSVP_ID } })
    })
  })
})
