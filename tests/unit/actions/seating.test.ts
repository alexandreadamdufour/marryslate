import { describe, it, expect, vi, beforeEach } from "vitest"
import { makeMockSupabase, type MockResult } from "../helpers/mock-supabase"

// --- Mocks de modules ---
vi.mock("@clerk/nextjs/server", () => ({
  auth:        vi.fn(),
  currentUser: vi.fn(),
}))
vi.mock("@/lib/supabase/clerk-client", () => ({
  createClerkSupabaseClient: vi.fn(),
}))

// --- Imports après mocks ---
import { auth } from "@clerk/nextjs/server"
import { createClerkSupabaseClient } from "@/lib/supabase/clerk-client"
import { deleteSeatingTable, unassignGuest } from "@/actions/seating"

const mockAuth         = vi.mocked(auth)
const mockCreateClient = vi.mocked(createClerkSupabaseClient)

// --- Fixtures ---
const TABLE_ID      = "table-uuid-1"
const ASSIGNMENT_ID = "assignment-uuid-1"
const WEDDING_ID    = "wedding-uuid-1"

/**
 * Ordre des appels from() dans deleteSeatingTable :
 *   seating_tables[0]           → select wedding_id (lookup ownership)
 *   rpc:is_wedding_coowner      → vérifie que le user est coowner
 *   seating_tables[1]           → delete
 *
 * Ordre des appels from() dans unassignGuest :
 *   seating_assignments[0]      → select avec join seating_tables(wedding_id)
 *   rpc:is_wedding_coowner      → vérifie que le user est coowner
 *   seating_assignments[1]      → delete
 */
function makeSeatingSupabase(overrides: Record<string, MockResult[]> = {}) {
  return makeMockSupabase({
    seating_tables: [
      { data: { wedding_id: WEDDING_ID }, error: null },  // [0] select lookup
      { data: null, error: null },                         // [1] delete → succès
    ],
    "rpc:is_wedding_coowner": [{ data: true, error: null }],
    ...overrides,
  })
}

function makeAssignmentSupabase(overrides: Record<string, MockResult[]> = {}) {
  return makeMockSupabase({
    seating_assignments: [
      { data: { table_id: "table-uuid", seating_tables: { wedding_id: WEDDING_ID } }, error: null },
      { data: null, error: null },  // delete → succès
    ],
    "rpc:is_wedding_coowner": [{ data: true, error: null }],
    ...overrides,
  })
}

describe("deleteSeatingTable", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: "user_clerk_text123" } as never)
    mockCreateClient.mockResolvedValue(makeSeatingSupabase().client as never)
  })

  // ─── Auth ───────────────────────────────────────────────────────────────────

  it("retourne UNAUTHORIZED si userId absent [casserait si le check auth() était retiré]", async () => {
    mockAuth.mockResolvedValue({ userId: null } as never)
    const result = await deleteSeatingTable(TABLE_ID)
    expect(result).toEqual({ error: "UNAUTHORIZED" })
    expect(mockCreateClient).not.toHaveBeenCalled()
  })

  // ─── Ownership cross-wedding (flow #2) ──────────────────────────────────────

  it("retourne NOT_FOUND si la table est introuvable en DB [casserait si le check !existing était retiré]", async () => {
    mockCreateClient.mockResolvedValue(
      makeSeatingSupabase({ seating_tables: [{ data: null, error: null }] }).client as never
    )
    const result = await deleteSeatingTable(TABLE_ID)
    expect(result).toEqual({ error: "NOT_FOUND" })
  })

  it("retourne FORBIDDEN si is_wedding_coowner = false — coowner A ne peut pas muter le mariage B [casserait si assertWeddingCoowner était retiré]", async () => {
    mockCreateClient.mockResolvedValue(
      makeSeatingSupabase({ "rpc:is_wedding_coowner": [{ data: false, error: null }] }).client as never
    )
    const result = await deleteSeatingTable(TABLE_ID)
    expect(result).toEqual({ error: "FORBIDDEN" })
  })

  it("retourne { data: undefined } si is_wedding_coowner = true et delete réussit [casserait si la logique post-auth était inversée]", async () => {
    const result = await deleteSeatingTable(TABLE_ID)
    expect(result).toEqual({ data: undefined })
  })

  // ─── Fix M6 — delete sans capture d'erreur ──────────────────────────────────

  it("retourne DB_ERROR si le delete échoue (RLS ou FK) — fix M6 [casserait si le if (deleteError) était retiré : faux succès renvoyé]", async () => {
    mockCreateClient.mockResolvedValue(
      makeSeatingSupabase({
        seating_tables: [
          { data: { wedding_id: WEDDING_ID }, error: null },                         // [0] select OK
          { data: null, error: { code: "42501", message: "RLS violation" } },        // [1] delete KO
        ],
      }).client as never
    )
    const result = await deleteSeatingTable(TABLE_ID)
    expect(result).toEqual({ error: "DB_ERROR" })
  })

  // ─── userId Clerk au format text (flow #5 — honnête) ────────────────────────

  it("userId Clerk non-UUID passe le check UNAUTHORIZED sans erreur [casserait si quelqu'un ajoutait z.string().uuid() ou isUUID() sur userId dans l'action]", async () => {
    // Un userId Clerk réel est du texte pur (ex: "user_2NNEqL2nrI..."), jamais un UUID.
    // Ce test vérifie que le code JS n'effectue aucun cast ou validation UUID sur ce champ.
    // Note : la vraie non-régression 22P02 (auth.uid() SQL vs text Clerk) nécessite un test
    // d'intégration contre la base — ce test couvre uniquement la couche JS.
    mockAuth.mockResolvedValue({ userId: "user_clerk_NOT_A_UUID_FORMAT" } as never)
    // La requête passe l'auth et arrive jusqu'au check de coowner
    // → FORBIDDEN prouve que le code n'a pas planté sur le format du userId
    mockCreateClient.mockResolvedValue(
      makeSeatingSupabase({ "rpc:is_wedding_coowner": [{ data: false, error: null }] }).client as never
    )
    const result = await deleteSeatingTable(TABLE_ID)
    expect(result).toEqual({ error: "FORBIDDEN" })  // FORBIDDEN, pas UNAUTHORIZED
  })
})

describe("unassignGuest", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth.mockResolvedValue({ userId: "user_clerk_text123" } as never)
    mockCreateClient.mockResolvedValue(makeAssignmentSupabase().client as never)
  })

  it("retourne UNAUTHORIZED si userId absent [casserait si le check auth() était retiré]", async () => {
    mockAuth.mockResolvedValue({ userId: null } as never)
    const result = await unassignGuest(ASSIGNMENT_ID)
    expect(result).toEqual({ error: "UNAUTHORIZED" })
  })

  it("retourne NOT_FOUND si l'assignment est introuvable [casserait si le check !row était retiré]", async () => {
    mockCreateClient.mockResolvedValue(
      makeAssignmentSupabase({ seating_assignments: [{ data: null, error: null }] }).client as never
    )
    const result = await unassignGuest(ASSIGNMENT_ID)
    expect(result).toEqual({ error: "NOT_FOUND" })
  })

  it("retourne FORBIDDEN si is_wedding_coowner = false [casserait si assertWeddingCoowner était retiré sur les assignments]", async () => {
    mockCreateClient.mockResolvedValue(
      makeAssignmentSupabase({ "rpc:is_wedding_coowner": [{ data: false, error: null }] }).client as never
    )
    const result = await unassignGuest(ASSIGNMENT_ID)
    expect(result).toEqual({ error: "FORBIDDEN" })
  })

  it("retourne DB_ERROR si le delete échoue — fix M6 [casserait si le if (deleteError) était retiré : faux succès renvoyé]", async () => {
    mockCreateClient.mockResolvedValue(
      makeAssignmentSupabase({
        seating_assignments: [
          { data: { table_id: "table-uuid", seating_tables: { wedding_id: WEDDING_ID } }, error: null },
          { data: null, error: { code: "42501", message: "RLS violation" } },
        ],
      }).client as never
    )
    const result = await unassignGuest(ASSIGNMENT_ID)
    expect(result).toEqual({ error: "DB_ERROR" })
  })
})
