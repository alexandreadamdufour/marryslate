"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"
import type { SeatingTableWithGuests } from "@/queries/seating"
import type { Guest } from "@/queries/guests"

const SeatingEditor = dynamic(() => import("./seating-editor").then((m) => m.SeatingEditor), {
  ssr: false,
  loading: () => <Skeleton className="h-96 w-full rounded-xl" />,
})

interface Props {
  initialTables: SeatingTableWithGuests[]
  guests: Guest[]
  weddingId: string
}

export function SeatingEditorGate(props: Props) {
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)")
    setIsDesktop(mq.matches)
    const listener = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener("change", listener)
    return () => mq.removeEventListener("change", listener)
  }, [])

  if (!isDesktop) return null
  return <SeatingEditor {...props} />
}
