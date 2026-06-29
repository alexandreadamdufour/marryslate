import { vi } from "vitest"

export type MockResult = {
  data?: unknown
  error: { code?: string; message?: string; details?: string; hint?: string } | null
}

export type MockCaptures = {
  updates: Record<string, unknown[]>  // table → payloads passés à update()
  inserts: Record<string, unknown[]>  // table → payloads passés à insert()
}

function makeBuilder(table: string, result: MockResult, captures: MockCaptures) {
  const p = Promise.resolve(result)
  const b: Record<string, unknown> = {
    select:      () => b,
    insert:      (data: unknown) => {
      captures.inserts[table] ??= []
      captures.inserts[table].push(data)
      return b
    },
    update:      (data: unknown) => {
      captures.updates[table] ??= []
      captures.updates[table].push(data)
      return b
    },
    delete:      () => b,
    upsert:      () => b,
    eq:          () => b,
    neq:         () => b,
    is:          () => b,
    gt:          () => b,
    gte:         () => b,
    lt:          () => b,
    lte:         () => b,
    in:          () => b,
    not:         () => b,
    filter:      () => b,
    order:       () => b,
    limit:       () => b,
    range:       () => b,
    maybeSingle: () => p,
    single:      () => p,
    then:        p.then.bind(p),
    catch:       p.catch.bind(p),
    finally:     p.finally.bind(p),
  }
  return b
}

/**
 * Crée un mock du client Supabase.
 *
 * Retourne `{ client, captures }` :
 * - `client`   : passer à `mockCreateClient.mockResolvedValue()` / `mockCreateAdmin.mockReturnValue()`
 * - `captures` : inspecter après l'appel pour vérifier les mutations (updates/inserts par table)
 *
 * `responses` : map `table → résultats ordonnés`.
 * Chaque appel à `from(table)` consomme le prochain résultat.
 * Si la liste est épuisée, le dernier est répété.
 * Pour `rpc`, utiliser la clé `"rpc:<nom_fonction>"`.
 */
export function makeMockSupabase(responses: Record<string, MockResult[]>) {
  const counters: Record<string, number> = {}
  const captures: MockCaptures = { updates: {}, inserts: {} }

  const client = {
    from: vi.fn((table: string) => {
      const idx = counters[table] ?? 0
      counters[table] = idx + 1
      const list = responses[table] ?? []
      const result = list[idx] ?? list[list.length - 1] ?? { data: null, error: null }
      return makeBuilder(table, result, captures)
    }),
    rpc: vi.fn((fn: string) => {
      const result = responses[`rpc:${fn}`]?.[0] ?? { data: null, error: null }
      return Promise.resolve(result)
    }),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: "https://test.supabase.co/storage/v1/object/public/gift-images/test.jpg" },
        }),
      })),
    },
  }

  return { client, captures }
}
