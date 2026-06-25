"use client"

import { createContext, useCallback, useContext, useState } from "react"
import type { ReactNode } from "react"

export interface PreviewData {
  partner1: string
  partner2: string
  date: string
  color: string
  fontFamily: string
}

interface SitePreviewContextValue {
  preview: PreviewData
  updatePreview: (data: Partial<PreviewData>) => void
}

const SitePreviewContext = createContext<SitePreviewContextValue | null>(null)

export function SitePreviewProvider({
  children,
  initial,
}: {
  children: ReactNode
  initial: PreviewData
}) {
  const [preview, setPreview] = useState<PreviewData>(initial)

  const updatePreview = useCallback((data: Partial<PreviewData>) => {
    setPreview((prev) => ({ ...prev, ...data }))
  }, [])

  return (
    <SitePreviewContext.Provider value={{ preview, updatePreview }}>
      {children}
    </SitePreviewContext.Provider>
  )
}

export function useSitePreview() {
  const ctx = useContext(SitePreviewContext)
  if (!ctx) throw new Error("useSitePreview must be used within SitePreviewProvider")
  return ctx
}
