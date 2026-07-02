import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/dashboard/sidebar"
import { createAdminClient } from "@/lib/supabase/admin"
import { CONNEXION_ROUTE } from "@/lib/constants"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect(CONNEXION_ROUTE)

  // Rediriger vers l'onboarding si le user n'a pas encore de wedding.
  // adminClient requis : createServerClient() n'envoie pas de JWT Clerk à Supabase.
  const supabase = createAdminClient()
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", userId)
    .is("deleted_at", null)
    .maybeSingle()

  if (!user) redirect(CONNEXION_ROUTE)

  const { data: coowner } = await supabase
    .from("wedding_coowners")
    .select("wedding_id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!coowner) redirect("/onboarding/etape-1")

  return (
    <div className="flex h-screen flex-col overflow-hidden md:flex-row">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Aller au contenu principal
      </a>
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main id="main-content" className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
