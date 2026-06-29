import { describe, it, expect, vi, beforeEach } from "vitest"
import { headers } from "next/headers"
import { makeMockSupabase, type MockResult } from "../helpers/mock-supabase"

// --- Mocks de modules ---
vi.mock("@/lib/stripe/client", () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
  },
}))
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}))
vi.mock("@/lib/resend/send", () => ({
  sendContributionReceipt:     vi.fn().mockResolvedValue(undefined),
  sendCoupleContributionNotif: vi.fn().mockResolvedValue(undefined),
  sendPayoutNotif:             vi.fn().mockResolvedValue(undefined),
}))

// --- Imports après mocks ---
import { stripe } from "@/lib/stripe/client"
import { createAdminClient } from "@/lib/supabase/admin"
import { POST } from "@/app/api/webhooks/stripe/route"

const mockConstructEvent = vi.mocked(stripe.webhooks.constructEvent)
const mockCreateAdmin    = vi.mocked(createAdminClient)
const mockHeaders        = vi.mocked(headers)

// --- Fixtures ---
const CONTRIB_ID  = "contrib-uuid-1"
const GIFT_ID     = "gift-uuid-1"
const WEDDING_ID  = "wedding-uuid-1"
const PI_ID       = "pi_test_123"
const OWNER_ID    = "owner-uuid-1"

/**
 * Événements Stripe factorisés.
 * Le gift_id dans les metadata est important : si existing.gift_id est null,
 * le handler tente `pi.metadata?.gift_id` comme fallback.
 */
function makeEvent(type: string, piOverrides: Record<string, unknown> = {}) {
  return {
    type,
    data: {
      object: {
        id: PI_ID,
        metadata: {
          contribution_id: CONTRIB_ID,
          wedding_id:      WEDDING_ID,
          gift_id:         GIFT_ID,
        },
        ...piOverrides,
      },
    },
  }
}

/**
 * Ordre des appels `from()` dans `payment_intent.succeeded` (flow complet) :
 *   contributions[0]  → select existing (maybeSingle)
 *   contributions[1]  → update status   (await direct)
 *   contributions[2]  → select net_amount pour sum (await direct)
 *   gifts[0]          → update current_amount (await direct)
 *   weddings[0]       → select infos email (maybeSingle)
 *   gifts[1]          → select title (maybeSingle)
 *   users[0]          → select email owner (maybeSingle)
 */
function makeDefaultWebhookSupabase(overrides: Record<string, MockResult[]> = {}) {
  return makeMockSupabase({
    contributions: [
      // [0] select existing → contribution pending, avec cadeau et email
      {
        data: {
          id:            CONTRIB_ID,
          payment_status: "pending",
          guest_email:   "guest@test.com",
          guest_name:    "Marie Dupont",
          gift_id:       GIFT_ID,
          gross_amount:  "55.00",
          net_amount:    "50.00",
          wedding_id:    WEDDING_ID,
          is_anonymous:  false,
        },
        error: null,
      },
      { data: null, error: null },                              // [1] update status → OK
      { data: [{ net_amount: "50.00" }], error: null },         // [2] select sum → 50 €
    ],
    gifts: [
      { data: null, error: null },                              // [0] update current_amount → OK
      { data: { title: "Voyage de noces" }, error: null },      // [1] select title
    ],
    weddings: [
      {
        data: {
          partner1_first_name:    "Sophie",
          partner2_first_name:    "Thomas",
          slug:                   "sophie-et-thomas",
          owner_id:               OWNER_ID,
          notifications_enabled:  true,
        },
        error: null,
      },
    ],
    users: [{ data: { email: "couple@test.com" }, error: null }],
    ...overrides,
  })
}

/** Request minimale — body et sig ne sont pas vérifiés (constructEvent est mocké). */
function makeRequest(body = "{}") {
  return new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    body,
  })
}

// --- Tests ---
describe("POST /api/webhooks/stripe", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test"
    // Headers avec stripe-signature présente par défaut
    mockHeaders.mockResolvedValue(new Headers({ "stripe-signature": "sig_test" }))
    // Événement par défaut : payment_intent.succeeded, contribution pending
    mockConstructEvent.mockReturnValue(makeEvent("payment_intent.succeeded") as never)
    // Client admin par défaut
    const { client } = makeDefaultWebhookSupabase()
    mockCreateAdmin.mockReturnValue(client as never)
  })

  // ─── Sécurité / signature ────────────────────────────────────────────────────

  describe("vérification de signature", () => {
    it("retourne 400 si le header stripe-signature est absent", async () => {
      mockHeaders.mockResolvedValue(new Headers())  // pas de stripe-signature
      const res = await POST(makeRequest())
      expect(res.status).toBe(400)
      expect(await res.text()).toBe("Signature manquante")
    })

    it("retourne 400 si constructEvent throw — simule une signature invalide ou un body altéré", async () => {
      mockConstructEvent.mockImplementation(() => {
        throw new Error("No signatures found matching the expected signature for payload")
      })
      const res = await POST(makeRequest("body-altere"))
      expect(res.status).toBe(400)
      expect(await res.text()).toBe("Signature invalide")
    })

    it("retourne 500 si STRIPE_WEBHOOK_SECRET est absent de l'env", async () => {
      delete process.env.STRIPE_WEBHOOK_SECRET
      const res = await POST(makeRequest())
      expect(res.status).toBe(500)
    })
  })

  // ─── payment_intent.succeeded ────────────────────────────────────────────────

  describe("payment_intent.succeeded", () => {
    it("retourne 200 et ne touche pas la DB si contribution_id est absent des metadata", async () => {
      mockConstructEvent.mockReturnValue(
        makeEvent("payment_intent.succeeded", { metadata: { wedding_id: WEDDING_ID } }) as never
      )
      const { client } = makeDefaultWebhookSupabase()
      mockCreateAdmin.mockReturnValue(client as never)

      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
      // createAdminClient est appelé mais aucune requête from() ne part
      expect(client.from).not.toHaveBeenCalled()
    })

    it("idempotence — ne retraite PAS une contribution déjà succeeded (current_amount non compté 2×)", async () => {
      const { client, captures } = makeDefaultWebhookSupabase({
        contributions: [
          // [0] select → déjà succeeded → le handler break immédiatement
          {
            data: {
              id:             CONTRIB_ID,
              payment_status: "succeeded",
              gift_id:        GIFT_ID,
              wedding_id:     WEDDING_ID,
              guest_email:    "guest@test.com",
              guest_name:     "Marie Dupont",
              gross_amount:   "55.00",
              net_amount:     "50.00",
              is_anonymous:   false,
            },
            error: null,
          },
        ],
      })
      mockCreateAdmin.mockReturnValue(client as never)

      const res = await POST(makeRequest())
      expect(res.status).toBe(200)

      // Aucune mise à jour en base — ni le statut, ni current_amount
      expect(captures.updates["contributions"]).toBeUndefined()
      expect(captures.updates["gifts"]).toBeUndefined()
    })

    it("met à jour la contribution avec payment_status succeeded et stripe_payment_intent_id", async () => {
      const { client, captures } = makeDefaultWebhookSupabase()
      mockCreateAdmin.mockReturnValue(client as never)

      const res = await POST(makeRequest())
      expect(res.status).toBe(200)

      expect(captures.updates["contributions"]?.[0]).toMatchObject({
        payment_status:          "succeeded",
        stripe_payment_intent_id: PI_ID,
      })
    })

    it("recalcule current_amount en sommant toutes les contributions succeeded du cadeau", async () => {
      // Mock : 2 contributions succeeded à 50 € chacune → total = 100 €
      const { client, captures } = makeDefaultWebhookSupabase({
        contributions: [
          {
            data: {
              id: CONTRIB_ID, payment_status: "pending",
              guest_email: null, guest_name: "Marie",
              gift_id: GIFT_ID, gross_amount: "55.00", net_amount: "50.00",
              wedding_id: WEDDING_ID, is_anonymous: true,
            },
            error: null,
          },
          { data: null, error: null },                                                  // update status
          { data: [{ net_amount: "50.00" }, { net_amount: "50.00" }], error: null },   // sum : 2 × 50 €
        ],
      })
      mockCreateAdmin.mockReturnValue(client as never)

      await POST(makeRequest())

      expect(captures.updates["gifts"]?.[0]).toEqual({ current_amount: 100 })
    })

    it("ne touche pas la table gifts si la contribution n'est liée à aucun cadeau", async () => {
      // gift_id null en DB ET absent (vide) des metadata → giftId = null → pas de mise à jour
      mockConstructEvent.mockReturnValue(
        makeEvent("payment_intent.succeeded", {
          metadata: { contribution_id: CONTRIB_ID, wedding_id: WEDDING_ID, gift_id: "" },
        }) as never
      )
      const { client, captures } = makeDefaultWebhookSupabase({
        contributions: [
          {
            data: {
              id: CONTRIB_ID, payment_status: "pending",
              guest_email: null, guest_name: "Marie",
              gift_id: null,   // ← pas de cadeau associé
              gross_amount: "55.00", net_amount: "50.00",
              wedding_id: WEDDING_ID, is_anonymous: true,
            },
            error: null,
          },
          { data: null, error: null },  // update status
        ],
        weddings: [
          {
            data: {
              partner1_first_name: "Sophie", partner2_first_name: "Thomas",
              slug: "sophie-et-thomas", owner_id: null, notifications_enabled: false,
            },
            error: null,
          },
        ],
      })
      mockCreateAdmin.mockReturnValue(client as never)

      await POST(makeRequest())
      expect(captures.updates["gifts"]).toBeUndefined()
    })
  })

  // ─── payment_intent.payment_failed ──────────────────────────────────────────

  describe("payment_intent.payment_failed", () => {
    it("passe la contribution à failed", async () => {
      mockConstructEvent.mockReturnValue(
        makeEvent("payment_intent.payment_failed") as never
      )
      const { client, captures } = makeDefaultWebhookSupabase({
        contributions: [{ data: null, error: null }],  // update → OK
      })
      mockCreateAdmin.mockReturnValue(client as never)

      const res = await POST(makeRequest())
      expect(res.status).toBe(200)
      expect(captures.updates["contributions"]?.[0]).toMatchObject({ payment_status: "failed" })
    })
  })
})
