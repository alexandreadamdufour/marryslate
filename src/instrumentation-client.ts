import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  // Replay uniquement en cas d'erreur, jamais sur les sessions normales.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
})

// Lazy-load : import depuis le package standalone @sentry/replay (pas
// @sentry/nextjs, déjà importé statiquement plus haut — un import()
// dynamique du même spécificateur ne scinde pas le chunk chez Turbopack,
// vérifié empiriquement).
// ⚠️ MAINTENANCE : @sentry/replay et @sentry/nextjs doivent rester à la
// même version majeure/mineure. Bumper les deux ensemble à chaque MAJ.
import("@sentry/replay").then(({ replayIntegration }) => {
  Sentry.addIntegration(replayIntegration())
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
