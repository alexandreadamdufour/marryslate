import type { NextConfig } from "next"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const isProd = process.env.NODE_ENV === "production"

// unsafe-inline : Next.js RSC hydration inline scripts + GTM init inline
// unsafe-eval  : requis par Crisp (leur doc CSP officielle)
// TODO: passer en Content-Security-Policy bloquant après validation prod (violations console)
const CSP = [
  "default-src 'self'",
  [
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "https://js.stripe.com",
    "https://client.crisp.chat",
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
    "https://*.clerk.accounts.dev",
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
  "font-src 'self' data:",
  [
    "connect-src 'self'",
    supabaseUrl,
    supabaseUrl.replace("https://", "wss://"),
    "https://api.stripe.com",
    "https://*.clerk.accounts.dev",
    "wss://*.clerk.accounts.dev",
    "https://client.crisp.chat",
    "wss://client.relay.crisp.chat",
    "https://www.google-analytics.com",
    "https://analytics.google.com",
    "https://region1.google-analytics.com",
  ].join(" "),
  [
    "frame-src",
    "https://js.stripe.com",
    "https://hooks.stripe.com",
    "https://*.clerk.accounts.dev",
    "https://game.crisp.chat",
  ].join(" "),
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isProd ? ["upgrade-insecure-requests"] : []),
].join("; ")

const securityHeaders = [
  // Bloquants immédiatement — pas de risque de casser les intégrations
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options",        value: "DENY" },
  { key: "Referrer-Policy",        value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",     value: "camera=(), microphone=(), geolocation=()" },
  // Report-Only : log les violations sans rien bloquer — à valider en prod avant passage bloquant
  { key: "Content-Security-Policy-Report-Only", value: CSP },
  ...(isProd
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  typedRoutes: true,
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

export default nextConfig
