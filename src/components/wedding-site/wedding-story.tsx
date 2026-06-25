import Image from "next/image"

interface WeddingStoryProps {
  title: string | null
  text: string
  images: string[]
}

export function WeddingStory({ title, text, images }: WeddingStoryProps) {
  const count = images.length

  return (
    <section id="notre-histoire" className="py-20">
      <div className="mx-auto max-w-2xl px-6">
        <h2 className="mb-8 text-center font-serif text-3xl sm:text-4xl">
          {title?.trim() || "Notre histoire"}
        </h2>

        <p className="whitespace-pre-wrap text-center text-base leading-relaxed text-muted-foreground sm:text-lg">
          {text}
        </p>

        {count > 0 && (
          <div className="mt-12">
            {/* 1 photo — pleine largeur paysage */}
            {count === 1 && images[0] && (
              <div className="relative aspect-video overflow-hidden rounded-xl">
                <Image
                  src={images[0]}
                  alt="Photo souvenir"
                  fill
                  sizes="(max-width: 768px) 100vw, 672px"
                  className="object-cover"
                />
              </div>
            )}

            {/* 2 photos — côte à côte */}
            {count === 2 && (
              <div className="grid grid-cols-2 gap-3">
                {images.map((url, i) => (
                  <div key={url} className="relative aspect-square overflow-hidden rounded-xl">
                    <Image
                      src={url}
                      alt={`Photo souvenir ${i + 1}`}
                      fill
                      sizes="(max-width: 768px) 50vw, 336px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* 3 photos — grille 3 colonnes */}
            {count === 3 && (
              <div className="grid grid-cols-3 gap-3">
                {images.map((url, i) => (
                  <div key={url} className="relative aspect-square overflow-hidden rounded-xl">
                    <Image
                      src={url}
                      alt={`Photo souvenir ${i + 1}`}
                      fill
                      sizes="(max-width: 768px) 33vw, 224px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* 4+ photos — masonry CSS colonnes, proportions naturelles */}
            {count >= 4 && (
              <div className="columns-2 gap-3 sm:columns-3">
                {images.map((url, i) => (
                  <div key={url} className="mb-3 break-inside-avoid overflow-hidden rounded-xl">
                    <Image
                      src={url}
                      alt={`Photo souvenir ${i + 1}`}
                      width={0}
                      height={0}
                      sizes="(max-width: 640px) calc(50vw - 1.5rem), calc(33vw - 1.5rem)"
                      style={{ width: "100%", height: "auto" }}
                      className="block"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
