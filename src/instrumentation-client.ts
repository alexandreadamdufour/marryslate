import * as Sentry from "@sentry/nextjs"

function initSentry() {
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
}

// Le SDK Sentry (~130 Kio) tirait au même instant que l'image LCP sur la
// homepage, contribuant à la contention réseau mobile (Bloc 2bis-B). Sur les
// routes où une erreur précoce est critique à capter (auth, dashboard, site
// public — argent en jeu), on garde l'init eager. Sur le reste (marketing,
// pas de flux sensible), on la diffère après l'idle du navigateur : léger
// angle mort sur les toutes premières erreurs, accepté pour ce gain LCP.
// captureRouterTransitionStart (export ci-dessous) est un no-op silencieux
// tant que init() n'a pas tourné — safe à appeler avant, vérifié dans
// @sentry/nextjs/build/esm/client/routing/appRouterRoutingInstrumentation.js.
const EAGER_PATH_PREFIXES = [
  "/dashboard",
  "/onboarding",
  "/connexion",
  "/inscription",
  "/m/",
  "/admin",
]

if (EAGER_PATH_PREFIXES.some((p) => window.location.pathname.startsWith(p))) {
  initSentry()
} else if ("requestIdleCallback" in window) {
  requestIdleCallback(initSentry, { timeout: 4000 })
} else {
  setTimeout(initSentry, 2000)
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
