interface WeddingStoryProps {
  storyMd: string
}

export function WeddingStory({ storyMd }: WeddingStoryProps) {
  return (
    <section id="notre-histoire" className="mx-auto max-w-2xl px-6 py-20 text-center">
      <h2 className="mb-8 text-3xl sm:text-4xl">Notre histoire</h2>
      <p className="whitespace-pre-wrap text-base leading-relaxed text-muted-foreground sm:text-lg">
        {storyMd}
      </p>
    </section>
  )
}
