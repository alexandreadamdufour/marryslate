import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { makeMockSupabase, type MockResult } from "../helpers/mock-supabase"

// --- Mocks de modules ---
vi.mock("@/lib/stripe/client", () => ({
  stripe: {
    paymentIntents: {
      create: vi.fn(),
    },
  },
}))
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}))
vi.mock("@/lib/rate-limit", () => ({
  getClientIp:                 vi.fn().mockReturnValue("127.0.0.1"),
  checkPaymentIntentRateLimit: vi.fn().mockResolvedValue(true),
  checkPhotoUploadRateLimit:   vi.fn().mockResolvedValue(true),
}))

// --- Imports après mocks ---
import { stripe } from "@/lib/stripe/client"
import { createAdminClient } from "@/lib/supabase/admin"
import { checkPaymentIntentRateLimit } from "@/lib/rate-limit"
import { createPaymentIntent } from "@/actions/contributions"

const mockCreatePI  = vi.mocked(stripe.paymentIntents.create)
const mockCreateAdmin = vi.mocked(createAdminClient)
const mockRateLimit   = vi.mocked(checkPaymentIntentRateLimit)

// --- Fixtures ---
const WEDDING_ID     = "wedding-uuid-1"
const STRIPE_ACCOUNT = "acct_stripe_test"
const CONTRIB_ID     = "contrib-insert-1"

const VALID_INPUT = {
  weddingSlug:      "sophie-et-thomas",
  guestName:        "Marie Dupont",
  grossAmountEuros: 50,
  isAnonymous:      false,
}

/**
 * Ordre des appels from() dans createPaymentIntent (sans gift, flow nominal) :
 *   weddings[0]      → select mariage publié
 *   contributions[0] → insert pending
 *   contributions[1] → update stripe_payment_intent_id (post-Stripe success)
 *                    OU delete rollback (post-Stripe failure)
 */
function makeDefaultContribSupabase(overrides: Record<string, MockResult[]> = {}) {
  return makeMockSupabase({
    weddings: [
      {
        data: {
          id:                  WEDDING_ID,
          stripe_account_id:   STRIPE_ACCOUNT,
          is_published:        true,
          partner1_first_name: "Sophie",
          partner2_first_name: "Thomas",
          slug:                "sophie-et-thomas",
        },
        error: null,
      },
    ],
    contributions: [
      { data: { id: CONTRIB_ID }, error: null }, // [0] insert → retourne l'id
      { data: null, error: null },               // [1] update PI_id ou delete rollback
    ],
    ...overrides,
  })
}

let consoleSpy: ReturnType<typeof vi.spyOn>

describe("createPaymentIntent", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Supprime le bruit console dans les tests, tout en capturant les appels
    consoleSpy = vi.spyOn(console, "error").mockImplementation(() => undefined)
    mockCreatePI.mockResolvedValue({
      id:            "pi_test_123",
      client_secret: "pi_test_123_secret_xxx",
    } as never)
    mockRateLimit.mockResolvedValue(true)
    mockCreateAdmin.mockReturnValue(makeDefaultContribSupabase().client as never)
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  // ─── Validation Zod ─────────────────────────────────────────────────────────

  describe("validation Zod", () => {
    it("rejette un input vide → INVALID_INPUT [casserait si Zod validation retirée]", async () => {
      const result = await createPaymentIntent({} as never)
      expect(result).toMatchObject({ error: "INVALID_INPUT" })
      expect(mockCreateAdmin).not.toHaveBeenCalled()
    })

    it("rejette grossAmountEuros < 5 (minimum Zod) → INVALID_INPUT [casserait si la borne min était supprimée]", async () => {
      const result = await createPaymentIntent({ ...VALID_INPUT, grossAmountEuros: 1 })
      expect(result).toMatchObject({ error: "INVALID_INPUT" })
    })
  })

  // ─── Rate limiting ───────────────────────────────────────────────────────────

  describe("rate limiting", () => {
    it("retourne RATE_LIMITED si la limite IP/wedding est atteinte [casserait si checkPaymentIntentRateLimit était retiré]", async () => {
      mockRateLimit.mockResolvedValue(false)
      const result = await createPaymentIntent(VALID_INPUT)
      expect(result).toEqual({ error: "RATE_LIMITED", details: undefined })
      expect(mockCreateAdmin).not.toHaveBeenCalled()
    })
  })

  // ─── Pré-conditions métier ───────────────────────────────────────────────────

  describe("pré-conditions", () => {
    it("retourne WEDDING_NOT_FOUND si le mariage est inconnu ou non publié [casserait si le check du mariage était retiré]", async () => {
      mockCreateAdmin.mockReturnValue(
        makeDefaultContribSupabase({ weddings: [{ data: null, error: null }] }).client as never
      )
      const result = await createPaymentIntent(VALID_INPUT)
      expect(result).toEqual({ error: "WEDDING_NOT_FOUND" })
      expect(mockCreatePI).not.toHaveBeenCalled()
    })

    it("retourne PAYMENTS_NOT_CONFIGURED si le mariage n'a pas de compte Stripe Connect [casserait si le check stripe_account_id était supprimé]", async () => {
      mockCreateAdmin.mockReturnValue(
        makeDefaultContribSupabase({
          weddings: [{ data: { id: WEDDING_ID, stripe_account_id: null, is_published: true, partner1_first_name: "Sophie", partner2_first_name: "Thomas", slug: "sophie-et-thomas" }, error: null }],
        }).client as never
      )
      const result = await createPaymentIntent(VALID_INPUT)
      expect(result).toEqual({ error: "PAYMENTS_NOT_CONFIGURED" })
      expect(mockCreatePI).not.toHaveBeenCalled()
    })
  })

  // ─── Flow nominal ────────────────────────────────────────────────────────────

  describe("flow nominal", () => {
    it("retourne { clientSecret, contributionId } après insert DB + appel Stripe réussi [casserait si l'insert ou le PI Stripe était cassé]", async () => {
      const result = await createPaymentIntent(VALID_INPUT)
      expect(result).toEqual({
        data: {
          clientSecret:   "pi_test_123_secret_xxx",
          contributionId: CONTRIB_ID,
        },
      })
      expect(mockCreatePI).toHaveBeenCalledOnce()
      // Le PaymentIntent est créé sur le bon compte Stripe Connect
      expect(mockCreatePI).toHaveBeenCalledWith(
        expect.objectContaining({ transfer_data: { destination: STRIPE_ACCOUNT } })
      )
    })
  })

  // ─── Gestion des erreurs Stripe + rollback ───────────────────────────────────

  describe("erreurs Stripe et rollback", () => {
    it("retourne STRIPE_ERROR si Stripe throw, sans log d'orphelin si le delete rollback réussit [casserait si le try/catch Stripe était retiré]", async () => {
      mockCreatePI.mockRejectedValue(new Error("Stripe connection error"))
      // contributions[1] = delete rollback → succès (pas d'erreur)
      mockCreateAdmin.mockReturnValue(makeDefaultContribSupabase().client as never)

      const result = await createPaymentIntent(VALID_INPUT)
      expect(result).toEqual({ error: "STRIPE_ERROR" })

      // Aucun log d'orphelin — le rollback a réussi
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining("[createPaymentIntent_rollback]"),
        expect.anything()
      )
    })

    it("M3 — log l'orphelin avec contributionId si Stripe throw ET que le delete rollback échoue [casserait si le if (rollbackError) ou le console.error orphelin était retiré]", async () => {
      mockCreatePI.mockRejectedValue(new Error("Stripe network error"))
      // contributions[1] = delete rollback → ÉCHOUE (FK constraint)
      mockCreateAdmin.mockReturnValue(
        makeDefaultContribSupabase({
          contributions: [
            { data: { id: CONTRIB_ID }, error: null },           // [0] insert
            { data: null, error: { code: "23503", message: "FK constraint violation" } }, // [1] delete KO
          ],
        }).client as never
      )

      const result = await createPaymentIntent(VALID_INPUT)
      expect(result).toEqual({ error: "STRIPE_ERROR" })

      // Le log d'orphelin est émis avec le contributionId pour retrouver la row manuellement
      expect(consoleSpy).toHaveBeenCalledWith(
        "[createPaymentIntent_rollback] ORPHAN contribution pending — nettoyage manuel requis",
        expect.objectContaining({ contributionId: CONTRIB_ID })
      )
    })
  })
})
