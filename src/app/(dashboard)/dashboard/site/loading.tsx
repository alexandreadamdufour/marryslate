import { Skeleton } from "@/components/ui/skeleton"

function SectionSkeleton({ lines = 2 }: { lines?: number }) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full max-w-lg" />
        ))}
      </div>
    </div>
  )
}

export default function SiteLoading() {
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-8 w-24 rounded-md" />
      </div>

      {/* Photo de couverture */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="aspect-[21/9] w-full rounded-xl" />
      </div>

      <div className="h-px bg-border" />
      <SectionSkeleton lines={3} />
      <div className="h-px bg-border" />
      <SectionSkeleton lines={2} />
      <div className="h-px bg-border" />
      <SectionSkeleton lines={2} />
      <div className="h-px bg-border" />
      <SectionSkeleton lines={3} />
      <div className="h-px bg-border" />
      <SectionSkeleton lines={2} />
    </div>
  )
}
