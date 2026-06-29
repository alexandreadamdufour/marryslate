import { describe, it, expect, vi, beforeEach } from "vitest"
import { makeMockSupabase, type MockResult } from "../helpers/mock-supabase"

// --- Mocks de modules ---
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  currentUser: vi.fn(),
}))
vi.mock("@/lib/supabase/clerk-client", () => ({
  createClerkSupabaseClient: vi.fn(),
}))
vi.mock("@/lib/stripe/connect", () => ({
  createConnectedAccount: vi.fn(),
  createOnboardingLink: vi.fn(),
  getAccountBalance: vi.fn(),
  createPayout: vi.fn(),
}))

// --- Imports après mocks (hoistés par Vitest) ---
import { auth } from "@clerk/nextjs/server"
import { createClerkSupabaseClient } from "@/lib/supabase/clerk-client"
import { getAccountBalance, createPayout } from "@/lib/stripe/connect"
import { requestPayout } from "@/actions/withdrawals"

const mockAuth = vi.mocked(auth)
const mockCreateClient = vi.mocked(createClerkSupabaseClient)
const mockGetBalance = vi.mocked(getAccountBalance)
const mockCreatePayout = vi.mocked(createPayout)

// --- Fixtures ---
const VALID_TOKEN = "550e8400-e29b-41d4-a716-446655440001"
const STRIPE_ACCOUNT = "acct_stripe_test"

/**
 * Répond à chaque from(table) dans l'ordre d'appel de requestPayout :
 *   from("users")[0]             → user DB
 *   from("wedding_coowners")[0]  → coowner
 *   from("weddings")[0]          → wedding
 *   from("withdrawals")[0]       → pending check (select)
 *   from("withdrawals")[1]       → insert retrait
 */
function makeDefaultSupabase(overrides: Record<string, MockResult[]> = {}) {
  return makeMockSupabase({
    users: [
      {
        data: {
          id: "db-user-uuid",
          email: "couple@test.com",
          stripe_account_id: STRIPE_ACCOUNT,
          kyc_status: "validated",
        },
        error: null,
      },
    ],
    wedding_coowners: [{ data: { wedding_id: "wedding-uuid" }, error: null }],
    weddings: [
      {
        data: {
          id: "wedding-uuid",
          slug: "sophie-et-thomas",
          stripe_account_id: null,          // user.stripe_account_id ?? wedding — user a priorité
          partner1_first_name: "Sophie",
          partner2_first_name: "Thomas",
        },
        error: null,
      },
    ],
    withdrawals: [
      { data: null, error: null },            // [0] select pending check → aucun en cours
      { data: null, error: null },            // [1] insert → succès
    ],
    ...overrides,
  }).client
}

// --- Tests ---
describe("requestPayout", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: "user_clerk_text123" } as never)
    mockGetBalance.mockResolvedValue(100_000)        // 1 000 € disponibles
    mockCreatePayout.mockResolvedValue("po_test_123")
    mockCreateClient.mockResolvedValue(makeDefaultSupabase() as never)
  })

  // ─── Validation Zod (aucun appel DB ni Stripe) ─────────────────────────────

  describe("validation Zod", () => {
    it("rejette NaN comme amountEuros", async () => {
      const result = await requestPayout(NaN, VALID_TOKEN)
      expect(result).toEqual({ error: "INVALID_INPUT" })
      expect(mockAuth).not.toHaveBeenCalled()
    })

    it("rejette 0 (en dessous du minimum de 1)", async () => {
      const result = await requestPayout(0, VALID_TOKEN)
      expect(result).toEqual({ error: "INVALID_INPUT" })
      expect(mockAuth).not.toHaveBeenCalled()
    })

    it("rejette un montant négatif", async () => {
      const result = await requestPayout(-50, VALID_TOKEN)
      expect(result).toEqual({ error: "INVALID_INPUT" })
      expect(mockAuth).not.toHaveBeenCalled()
    })

    it("rejette un idempotencyToken non-UUID", async () => {
      const result = await requestPayout(50, "pas-un-uuid")
      expect(result).toEqual({ error: "INVALID_INPUT" })
      expect(mockAuth).not.toHaveBeenCalled()
    })
  })

  // ─── Authentification ───────────────────────────────────────────────────────

  describe("auth", () => {
    it("retourne UNAUTHORIZED si userId absent (session expirée)", async () => {
      mockAuth.mockResolvedValue({ userId: null } as never)
      const result = await requestPayout(50, VALID_TOKEN)
      expect(result).toEqual({ error: "UNAUTHORIZED" })
      expect(mockCreateClient).not.toHaveBeenCalled()
    })

    it("retourne UNAUTHORIZED si le user est introuvable en DB (soft-deleted ou inexistant)", async () => {
      mockCreateClient.mockResolvedValue(
        makeDefaultSupabase({ users: [{ data: null, error: null }] }) as never
      )
      const result = await requestPayout(50, VALID_TOKEN)
      expect(result).toEqual({ error: "UNAUTHORIZED" })
      expect(mockGetBalance).not.toHaveBeenCalled()
    })
  })

  // ─── Pré-conditions métier ──────────────────────────────────────────────────

  describe("pré-conditions", () => {
    it("retourne UNAUTHORIZED si le user n'a aucun mariage associé", async () => {
      // wedding_coowners vide → getAuthenticatedUserAndWedding retourne null → ctx = null
      mockCreateClient.mockResolvedValue(
        makeDefaultSupabase({ wedding_coowners: [{ data: null, error: null }] }) as never
      )
      const result = await requestPayout(50, VALID_TOKEN)
      expect(result).toEqual({ error: "UNAUTHORIZED" })
    })

    it("retourne NO_WEDDING si la row weddings est introuvable (cas de corruption)", async () => {
      // coowner existe mais le mariage a disparu (cohérence brisée)
      mockCreateClient.mockResolvedValue(
        makeDefaultSupabase({ weddings: [{ data: null, error: null }] }) as never
      )
      const result = await requestPayout(50, VALID_TOKEN)
      expect(result).toEqual({ error: "NO_WEDDING" })
    })

    it("retourne STRIPE_NOT_CONFIGURED si aucun compte Stripe sur user ni mariage", async () => {
      mockCreateClient.mockResolvedValue(
        makeDefaultSupabase({
          users: [
            {
              data: { id: "db-user-uuid", email: "couple@test.com", stripe_account_id: null, kyc_status: "not_started" },
              error: null,
            },
          ],
          weddings: [
            {
              data: { id: "wedding-uuid", slug: "sophie-et-thomas", stripe_account_id: null, partner1_first_name: "Sophie", partner2_first_name: "Thomas" },
              error: null,
            },
          ],
        }) as never
      )
      const result = await requestPayout(50, VALID_TOKEN)
      expect(result).toEqual({ error: "STRIPE_NOT_CONFIGURED" })
      expect(mockGetBalance).not.toHaveBeenCalled()
    })

    it("retourne INSUFFICIENT_BALANCE si le solde Stripe est trop faible", async () => {
      mockGetBalance.mockResolvedValue(1_000)   // 10 € disponibles
      const result = await requestPayout(50, VALID_TOKEN) // demande 50 €
      expect(result).toEqual({ error: "INSUFFICIENT_BALANCE" })
      expect(mockCreatePayout).not.toHaveBeenCalled()
    })

    it("retourne PAYOUT_ALREADY_PENDING si un retrait est déjà en cours", async () => {
      mockCreateClient.mockResolvedValue(
        makeDefaultSupabase({
          withdrawals: [
            { data: { id: "withdrawal-in-progress" }, error: null }, // [0] select → retrait en cours
          ],
        }) as never
      )
      const result = await requestPayout(50, VALID_TOKEN)
      expect(result).toEqual({ error: "PAYOUT_ALREADY_PENDING" })
      expect(mockCreatePayout).not.toHaveBeenCalled()
    })
  })

  // ─── Erreurs Stripe ─────────────────────────────────────────────────────────

  describe("erreurs Stripe", () => {
    it("retourne STRIPE_API_ERROR si createPayout throw (réseau, rate limit, etc.)", async () => {
      mockCreatePayout.mockRejectedValue(new Error("Stripe network error"))
      const result = await requestPayout(50, VALID_TOKEN)
      expect(result).toEqual({ error: "STRIPE_API_ERROR" })
    })
  })

  // ─── Flow nominal ───────────────────────────────────────────────────────────

  describe("flow nominal", () => {
    it("crée le payout Stripe avec le bon montant et la clé d'idempotence, retourne le payoutId", async () => {
      const result = await requestPayout(50, VALID_TOKEN)

      expect(result).toEqual({ data: { payoutId: "po_test_123" } })

      // Vérifie que l'appel Stripe reçoit les bons arguments :
      // - account correct
      // - 50 € → 5 000 centimes
      // - clé d'idempotence au format attendu
      expect(mockCreatePayout).toHaveBeenCalledOnce()
      expect(mockCreatePayout).toHaveBeenCalledWith(
        STRIPE_ACCOUNT,
        5_000,
        `retrait-${VALID_TOKEN}`
      )
    })

    it("utilise stripe_account_id du user en priorité sur celui du mariage", async () => {
      // Cas où user.stripe_account_id ET wedding.stripe_account_id sont tous les deux définis
      // → le user a la priorité (user.stripe_account_id ?? wedding.stripe_account_id)
      mockCreateClient.mockResolvedValue(
        makeDefaultSupabase({
          weddings: [
            {
              data: {
                id: "wedding-uuid",
                slug: "sophie-et-thomas",
                stripe_account_id: "acct_wedding_fallback",
                partner1_first_name: "Sophie",
                partner2_first_name: "Thomas",
              },
              error: null,
            },
          ],
        }) as never
      )
      await requestPayout(50, VALID_TOKEN)
      // Le premier argument de createPayout doit être celui du user, pas du mariage
      expect(mockCreatePayout).toHaveBeenCalledWith(STRIPE_ACCOUNT, expect.any(Number), expect.any(String))
    })
  })
})
