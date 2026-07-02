declare global {
  interface Window {
    dataLayer?: unknown[]
  }
}

/**
 * Équivalent local de sendGAEvent (@next/third-parties/google). Nécessaire
 * car ce package ne permet pas de charger <GoogleAnalytics> en lazyOnload
 * (pas de prop strategy, ses <Script> internes sont hardcodés en
 * afterInteractive) — voir GoogleAnalyticsLazy (@/components/shared/
 * google-analytics-lazy). Leur sendGAEvent vérifie une variable interne au
 * module qui n'est jamais définie si <GoogleAnalytics> n'est jamais monté,
 * donc inutilisable ici.
 *
 * Pousse directement dans window.dataLayer, lu par gtag.js une fois chargé
 * — les events poussés avant ne sont pas perdus, juste traités en différé
 * (dataLayer est un simple tableau, gtag.js rattrape le retard au chargement).
 */
export function sendGAEvent(...args: unknown[]): void {
  if (typeof window === "undefined") return
  window.dataLayer = window.dataLayer ?? []
  window.dataLayer.push(args)
}
