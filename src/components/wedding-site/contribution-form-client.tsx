"use client"

import dynamic from "next/dynamic"
import type { Gift } from "@/queries/gifts"

interface Props {
  gifts: Gift[]
  defaultGiftId: string | null
  weddingSlug: string
  successUrl: string
}

const ContributionFormDynamic = dynamic(
  () => import("./contribution-form").then((m) => m.ContributionForm),
  { ssr: false, loading: () => <div className="h-96 animate-pulse rounded-xl bg-muted" /> },
)

export function ContributionFormClient(props: Props) {
  return <ContributionFormDynamic {...props} />
}
