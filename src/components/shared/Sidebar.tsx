import Link from "next/link"
import { BookOpen, LogOut } from "lucide-react"
import { signOutAction } from "@/actions/auth.actions"
import { NavLinks } from "./NavLinks"

export function Sidebar() {
  return (
    <aside className="flex h-screen w-60 flex-col border-r bg-background">
      <div className="flex h-14 items-center gap-2 border-b px-5">
        <Link href="/dashboard" className="flex items-center gap-2 font-black text-primary text-lg tracking-tight">
          <BookOpen className="h-5 w-5" />
          PassAm
        </Link>
      </div>

      <NavLinks />

      <div className="border-t p-3">
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-150 hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </form>
      </div>
    </aside>
  )
}
