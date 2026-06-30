import Link from "next/link"
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  linkClassName?: string
  hideLink?: boolean
}

export function Logo({ className, linkClassName, hideLink }: LogoProps) {
  const text = (
    <span className={cn("font-serif text-2xl tracking-tight text-foreground", className)}>
      Marryslate
</span>
  )

  if (hideLink) return text

  return (
    <Link href="/" className={cn("inline-flex items-center", linkClassName)}>
      {text}
    </Link>
  )
}
