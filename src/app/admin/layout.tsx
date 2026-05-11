import { getAppUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { signOutAction } from "@/actions/auth.actions"
import { AdminNav } from "@/components/admin/AdminNav"
import { BookMarked, ChevronLeft, LogOut } from "lucide-react"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAppUser()
  if (!user || user.role !== "ADMIN") redirect("/dashboard")

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="flex h-screen w-56 shrink-0 flex-col border-r bg-muted/30">
        <div className="flex h-14 items-center gap-2.5 border-b px-5">
          <BookMarked className="h-5 w-5 text-primary" />
          <div className="leading-none">
            <p className="text-xs font-black text-primary tracking-tight">PassAm</p>
            <p className="text-[10px] text-muted-foreground font-semibold">Admin Panel</p>
          </div>
        </div>

        <AdminNav />

        <div className="border-t p-3 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back to App
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
