import Image from "next/image"
import type { Wedding } from "@/queries/wedding"

interface WeddingHeroProps {
  wedding: Wedding
}

export function WeddingHero({ wedding }: WeddingHeroProps) {
  const formattedDate = wedding.wedding_date
    ? new Date(wedding.wedding_date).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null

  return (
    <section className="relative flex min-h-[90svh] flex-col items-center justify-center overflow-hidden">
      {/* Cover image */}
      {wedding.cover_image_url && (
        <>
          <Image
            src={wedding.cover_image_url}
            alt={`Mariage de ${wedding.partner1_first_name} & ${wedding.partner2_first_name}`}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/35" />
        </>
      )}

      {/* Content */}
      <div
        className={[
          "relative z-10 flex flex-col items-center gap-4 px-6 text-center",
          wedding.cover_image_url ? "text-white" : "text-foreground",
        ].join(" ")}
      >
        <p className="text-sm font-medium uppercase tracking-[0.25em] opacity-80">
          Mariage
        </p>
        <h1 className="text-5xl sm:text-7xl">
          {wedding.partner1_first_name}
          <span className="mx-4 opacity-60">&amp;</span>
          {wedding.partner2_first_name}
        </h1>
        {formattedDate && (
          <p className="text-lg opacity-90 sm:text-xl">{formattedDate}</p>
        )}
        {/* Scroll indicator */}
        <div className="mt-12 flex flex-col items-center gap-2 opacity-60">
          <div className="h-8 w-px animate-bounce bg-current" />
        </div>
      </div>
    </section>
  )
}
