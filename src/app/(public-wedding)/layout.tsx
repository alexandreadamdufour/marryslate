import { WEDDING_THEME_FONT_VARIABLES } from "@/lib/fonts"

export default function PublicWeddingLayout({ children }: { children: React.ReactNode }) {
  return <div className={WEDDING_THEME_FONT_VARIABLES}>{children}</div>
}
