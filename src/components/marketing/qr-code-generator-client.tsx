"use client"

import dynamic from "next/dynamic"

const QrCodeGeneratorDynamic = dynamic(
  () => import("./qr-code-generator").then((m) => m.QrCodeGenerator),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-xl bg-muted" /> },
)

export function QrCodeGeneratorClient() {
  return <QrCodeGeneratorDynamic />
}
