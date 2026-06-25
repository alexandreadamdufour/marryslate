"use client"

import type { ReactNode } from "react"
import { SitePreviewProvider, type PreviewData } from "./site-preview-context"
import { SitePreview } from "./site-preview"

interface Props {
  children: ReactNode
  initial: PreviewData
}

export function SitePageLayout({ children, initial }: Props) {
  return (
    <SitePreviewProvider initial={initial}>
      <div className="lg:grid lg:grid-cols-[1fr_340px] lg:items-start lg:gap-10">
        <div className="min-w-0">{children}</div>

        <div className="mt-10 lg:mt-0 lg:sticky lg:top-8">
          <p className="mb-2.5 text-sm font-medium text-muted-foreground">Aperçu en direct</p>
          <SitePreview />
          <p className="mt-2 text-center text-xs text-muted-foreground/60">
            Mis à jour sans enregistrer
          </p>
        </div>
      </div>
    </SitePreviewProvider>
  )
}
