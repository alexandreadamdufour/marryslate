"use client"

import Script from "next/script"

declare global {
  interface Window {
    $crisp: unknown[]
    CRISP_WEBSITE_ID: string
  }
}

export function CrispChat() {
  const websiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID
  if (!websiteId) return null

  return (
    <>
      <Script id="crisp-init" strategy="lazyOnload">
        {`
          window.$crisp = [];
          window.CRISP_WEBSITE_ID = "${websiteId}";
        `}
      </Script>
      <Script id="crisp-loader" strategy="lazyOnload" src="https://client.crisp.chat/l.js" />
    </>
  )
}
