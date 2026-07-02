"use client"

import { useCallback } from "react"
import { useDropzone, type FileRejection } from "react-dropzone"
import { toast } from "sonner"
import { Upload, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const ACCEPTED_TYPES = { "image/jpeg": [], "image/png": [], "image/webp": [], "image/avif": [] }
const MAX_SIZE_MB = 20

interface ImageDropzoneProps {
  onFilesAccepted: (files: File[]) => void
  multiple?: boolean
  disabled?: boolean
  className?: string
  label?: string
}

export function ImageDropzone({
  onFilesAccepted,
  multiple = false,
  disabled = false,
  className,
  label = "Glissez une photo ici, ou cliquez pour parcourir",
}: ImageDropzoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      for (const rejection of fileRejections) {
        const tooLarge = rejection.errors.some((e) => e.code === "file-too-large")
        toast.error(
          tooLarge
            ? `Fichier "${rejection.file.name}" trop volumineux (>${MAX_SIZE_MB} Mo). Compresse-le d'abord.`
            : `Fichier "${rejection.file.name}" refusé (format non supporté).`
        )
      }
      if (acceptedFiles.length > 0) onFilesAccepted(acceptedFiles)
    },
    [onFilesAccepted]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    multiple,
    disabled,
    maxSize: MAX_SIZE_MB * 1024 * 1024,
  })

  return (
    <div
      {...getRootProps()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-muted-foreground transition-colors",
        isDragActive ? "border-primary bg-primary/5 text-primary" : "hover:border-primary hover:text-primary",
        disabled && "pointer-events-none opacity-60",
        className
      )}
    >
      <input {...getInputProps()} />
      {disabled ? (
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
      ) : (
        <>
          <Upload className="h-6 w-6" aria-hidden="true" />
          <span className="text-center text-sm">{label}</span>
        </>
      )}
    </div>
  )
}
