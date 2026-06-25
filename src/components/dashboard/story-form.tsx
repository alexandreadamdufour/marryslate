"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import imageCompression from "browser-image-compression"
import { Loader2, Upload, X } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { updateStorySchema, type UpdateStoryInput } from "@/lib/validators/story"
import { updateStory, uploadStoryImage } from "@/actions/story"
import type { Tables } from "@/lib/supabase/types"

interface Props {
  wedding: Tables<"weddings">
}

export function StoryForm({ wedding }: Props) {
  const existingImages = (wedding.story_images as string[] | null) ?? []
  const [images, setImages] = useState<string[]>(existingImages)
  const [uploading, setUploading] = useState<number | null>(null) // index du slot en cours

  const form = useForm<UpdateStoryInput>({
    resolver: zodResolver(updateStorySchema),
    defaultValues: {
      weddingId: wedding.id,
      storyTitle: wedding.story_title ?? "",
      storyText: wedding.story_md ?? "",
      storyImages: existingImages,
    },
  })

  async function handleImageChange(
    e: React.ChangeEvent<HTMLInputElement>,
    slotIndex: number
  ) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(slotIndex)
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
      })

      const fd = new FormData()
      fd.append("file", compressed, file.name)
      fd.append("weddingId", wedding.id)

      const result = await uploadStoryImage(fd)
      if (result.error || result.data === undefined) {
        toast.error("Erreur lors de l'upload.")
        return
      }

      const next = [...images]
      next[slotIndex] = result.data.url
      setImages(next)
      form.setValue("storyImages", next.filter(Boolean))
    } catch {
      toast.error("Erreur lors de la compression.")
    } finally {
      setUploading(null)
      e.target.value = ""
    }
  }

  function removeImage(slotIndex: number) {
    const next = [...images]
    next.splice(slotIndex, 1)
    setImages(next)
    form.setValue("storyImages", next.filter(Boolean))
  }

  async function onSubmit(values: UpdateStoryInput) {
    const result = await updateStory({ ...values, storyImages: images.filter(Boolean) })
    if (result.error) {
      toast.error("Erreur lors de la sauvegarde.")
      return
    }
    toast.success("Histoire enregistrée")
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-lg space-y-6">
        {/* Titre */}
        <FormField
          control={form.control}
          name="storyTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titre</FormLabel>
              <FormControl>
                <Input placeholder="Notre histoire" {...field} value={field.value ?? ""} />
              </FormControl>
              <FormDescription>Laissez vide pour afficher &laquo;&nbsp;Notre histoire&nbsp;&raquo;.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Texte */}
        <FormField
          control={form.control}
          name="storyText"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Votre histoire *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Racontez comment vous vous êtes rencontrés…"
                  rows={8}
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>Jusqu&apos;à 10&nbsp;000 caractères.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Photos */}
        <div className="space-y-3">
          <p className="text-sm font-medium leading-none">
            Photos{" "}
            <span className="font-normal text-muted-foreground">(3&nbsp;max)</span>
          </p>

          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => {
              const url = images[i]
              const isUploading = uploading === i

              return (
                <div key={i} className="relative aspect-square">
                  {url ? (
                    <>
                      <Image
                        src={url}
                        alt={`Photo ${i + 1}`}
                        fill
                        sizes="160px"
                        className="rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                        aria-label="Supprimer la photo"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <label
                      className={[
                        "flex h-full cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed text-muted-foreground transition-colors",
                        isUploading ? "opacity-60" : "hover:border-primary hover:text-primary",
                      ].join(" ")}
                    >
                      {isUploading ? (
                        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                      ) : (
                        <>
                          <Upload className="h-5 w-5" aria-hidden="true" />
                          <span className="mt-1 text-xs">Photo {i + 1}</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/avif"
                        className="sr-only"
                        disabled={isUploading || uploading !== null}
                        onChange={(e) => handleImageChange(e, i)}
                      />
                    </label>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <Button
          type="submit"
          disabled={form.formState.isSubmitting || uploading !== null}
        >
          {form.formState.isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Enregistrement…
            </>
          ) : (
            "Enregistrer"
          )}
        </Button>
      </form>
    </Form>
  )
}
