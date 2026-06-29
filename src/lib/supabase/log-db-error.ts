type DbError = {
  code?: string
  message?: string
  details?: string
  hint?: string
} | null | undefined

// Logue uniquement les métadonnées d'erreur PostgreSQL (code technique, description de contrainte).
// Ne contient jamais de valeurs de colonnes utilisateur — RGPD-safe.
export function logDbError(context: string, error: DbError): void {
  console.error(`[${context}]`, {
    code: error?.code,
    message: error?.message,
    details: error?.details,
    hint: error?.hint,
  })
}
