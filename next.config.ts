import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const isProd = process.env.NODE_ENV === "production"

// Dérive l'endpoint de report CSP natif Sentry depuis le DSN plutôt que de
// dupliquer org/projet/clé en dur. No-op si NEXT_PUBLIC_SENTRY_DSN absent.
function getSentryCspReportUri(dsn: string | undefined): string | undefined {
  if (!dsn) return undefined
  try {
    const parsed = new URL(dsn)
    const projectId = parsed.pathname.replace(/^\//, "")
    if (!projectId || !parsed.username) return undefined
    return `https://${parsed.host}/api/${projectId}/security/?sentry_key=${parsed.username}`
  } catch {
    return undefined
  }
}

const sentryReportUri = getSentryCspReportUri(process.env.NEXT_PUBLIC_SENTRY_DSN)

// unsafe-inline : Next.js RSC hydration inline scripts + GTM init inline
// unsafe-eval  : requis par Crisp (leur doc CSP officielle)
const CSP = [
  "default-src 'self'",
  [
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "https://js.stripe.com",
    "https://client.crisp.chat",
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
    "https://*.clerk.accounts.dev",
    "https://clerk.marryslate.com",
    "https://challenges.cloudflare.com",
  ].join(" "),
  "style-src 'self' 'unsafe-inline' https://client.crisp.chat",
  [
    "img-src 'self' data: blob:",
    supabaseUrl,
    "https://img.clerk.com",
    "https://image.crisp.chat",
    "https://client.crisp.chat",
    "https://www.google-analytics.com",
    "https://www.googletagmanager.com",
  ].join(" "),
  "font-src 'self' data: https://client.crisp.chat",
  [
    "connect-src 'self'",
    supabaseUrl,
    supabaseUrl.replace("https://", "wss://"),
    "https://api.stripe.com",
    "https://*.clerk.accounts.dev",
    "wss://*.clerk.accounts.dev",
    "https://clerk.marryslate.com",
    "wss://clerk.marryslate.com",
    "https://clerk-telemetry.com",
    "https://client.crisp.chat",
    "wss://client.relay.crisp.chat",
    "https://www.google-analytics.com",
    "https://analytics.google.com",
    "https://region1.google-analytics.com",
    "https://*.sentry.io",
  ].join(" "),
  [
    "frame-src",
    "https://js.stripe.com",
    "https://hooks.stripe.com",
    "https://*.clerk.accounts.dev",
    "https://clerk.marryslate.com",
    "https://challenges.cloudflare.com",
    "https://game.crisp.chat",
  ].join(" "),
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
  ...(sentryReportUri ? [`report-uri ${sentryReportUri}`] : []),
].join("; ")

const securityHeaders = [
  // Bloquants immédiatement — pas de risque de casser les intégrations
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options",        value: "DENY" },
  { key: "Referrer-Policy",        value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",     value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: CSP },
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  typedRoutes: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  org: "marryslate",
  project: "javascript-nextjs",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  widenClientFileUpload: true,
})
