import Image from "next/image"

interface WeddingStoryProps {
  title: string | null
  text: string
  images: string[]
}

export function WeddingStory({ title, text, images }: WeddingStoryProps) {
  const photoCount = Math.min(images.length, 3)

  return (
    <section id="notre-histoire" className="py-20">
      <div className="mx-auto max-w-2xl px-6">
        <h2 className="mb-8 text-center font-serif text-3xl sm:text-4xl">
          {title?.trim() || "Notre histoire"}
        </h2>

        <p className="whitespace-pre-wrap text-center text-base leading-relaxed text-muted-foreground sm:text-lg">
          {text}
        </p>

        {photoCount > 0 && (
          <div
            className={[
              "mt-12 grid gap-3",
              photoCount === 1 ? "grid-cols-1" : "",
              photoCount === 2 ? "grid-cols-2" : "",
              photoCount === 3 ? "grid-cols-3" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            {images.slice(0, 3).map((url, i) => (
              <div
                key={i}
                className={[
                  "relative overflow-hidden rounded-xl",
                  photoCount === 1 ? "aspect-video" : "aspect-square",
                ].join(" ")}
              >
                <Image
                  src={url}
                  alt={`Photo souvenir ${i + 1}`}
                  fill
                  sizes={
                    photoCount === 1
                      ? "(max-width: 768px) 100vw, 672px"
                      : "(max-width: 768px) 50vw, 224px"
                  }
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
