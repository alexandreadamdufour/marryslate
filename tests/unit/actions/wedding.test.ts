import { describe, it, expect, vi, beforeEach } from "vitest"
import { makeMockSupabase } from "../helpers/mock-supabase"

// --- Mocks de modules ---
vi.mock("@clerk/nextjs/server", () => ({
  auth:        vi.fn(),
  currentUser: vi.fn(),
}))
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}))
vi.mock("@/lib/supabase/clerk-client", () => ({
  createClerkSupabaseClient: vi.fn(),
}))

// --- Imports après mocks ---
import { auth, currentUser } from "@clerk/nextjs/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClerkSupabaseClient } from "@/lib/supabase/clerk-client"
import { createWedding } from "@/actions/wedding"

const mockAuth         = vi.mocked(auth)
const mockCurrentUser  = vi.mocked(currentUser)
const mockCreateAdmin  = vi.mocked(createAdminClient)
const mockCreateClient = vi.mocked(createClerkSupabaseClient)

// --- Fixtures ---
const CLERK_USER_ID = "user_clerk123"
const USER_ID       = "user-uuid-1"
const WEDDING_ID    = "wedding-uuid-1"
const SLUG          = "alice-et-bob"

const VALID_INPUT = {
  partner1FirstName: "Alice",
  partner2FirstName: "Bob",
  slug: SLUG,
}

/*
 * Séquence d'appels from() sur l'admin client dans createWedding :
 *
 *   getOrCreateUser (admin) :
 *     users[0] → SELECT : user not found
 *     users[1] → INSERT : configurable (succès | 23505 | autre erreur)
 *     users[2] → SELECT re-read : utilisé uniquement sur 23505
 *
 *   createWedding slug check (admin, même client instance) :
 *     weddings[0] → SELECT : slug libre
 *
 *   createWedding mutations (clerk client) :
 *     weddings[0]         → INSERT wedding
 *     wedding_coowners[0] → INSERT coowner
 */
function makeAdminClient(insertResult: { data: unknown; error: { code?: string; message?: string } | null }) {
  return makeMockSupabase({
    users: [
      { data: null,              error: null },  // [0] SELECT → not found
      { ...insertResult },                       // [1] INSERT → configurable
      { data: { id: USER_ID },  error: null },  // [2] re-SELECT après 23505
    ],
    weddings: [
      { data: null, error: null },              // slug check → libre
    ],
  }).client
}

function makeClerkClient() {
  return makeMockSupabase({
    weddings:         [{ data: { id: WEDDING_ID, slug: SLUG }, error: null }],
    wedding_coowners: [{ data: null, error: null }],
  }).client
}

describe("createWedding — gestion de la race condition dans getOrCreateUser", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: CLERK_USER_ID } as never)
    mockCurrentUser.mockResolvedValue({
      emailAddresses: [{ emailAddress: "alice@example.com" }],
      firstName: "Alice",
      lastName:  "Martin",
    } as never)
    mockCreateClient.mockResolvedValue(makeClerkClient() as never)
  })

  it("cas nominal : INSERT user réussi → mariage créé", async () => {
    mockCreateAdmin.mockReturnValue(
      makeAdminClient({ data: { id: USER_ID }, error: null }) as never
    )

    const result = await createWedding(VALID_INPUT)

    expect(result).toEqual({ data: { id: WEDDING_ID, slug: SLUG } })
  })

  it("race 23505 : re-SELECT le user existant et crée le mariage (PAS USER_NOT_FOUND)", async () => {
    mockCreateAdmin.mockReturnValue(
      makeAdminClient({
        data:  null,
        error: { code: "23505", message: "duplicate key value violates unique constraint" },
      }) as never
    )

    const result = await createWedding(VALID_INPUT)

    // Sans le fix, getOrCreateUser retournait null → { error: "USER_NOT_FOUND" }
    expect(result).not.toHaveProperty("error", "USER_NOT_FOUND")
    expect(result).toEqual({ data: { id: WEDDING_ID, slug: SLUG } })
  })

  it("erreur DB non-23505 : retourne USER_NOT_FOUND", async () => {
    mockCreateAdmin.mockReturnValue(
      makeAdminClient({
        data:  null,
        error: { code: "08006", message: "connection failure" },
      }) as never
    )

    const result = await createWedding(VALID_INPUT)

    expect(result).toHaveProperty("error", "USER_NOT_FOUND")
  })
})
