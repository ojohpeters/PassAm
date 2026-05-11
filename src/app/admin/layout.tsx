import { getAppUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { signOutAction } from "@/actions/auth.actions"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAppUser()
  if (!user || user.role !== "ADMIN") redirect("/dashboard")

  return (
    <div className="flex h-screen">
      <aside className="flex h-screen w-52 flex-col border-r bg-background">
        <div className="flex h-14 items-center border-b px-4 font-bold text-primary">
          PassAm Admin
        </div>
        <nav className="flex-1 space-y-1 p-3 text-sm">
          {[
            { href: "/admin", label: "Overview" },
            { href: "/admin/questions", label: "Questions" },
            { href: "/admin/feedback", label: "Feedback" },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="block rounded-md px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t p-3">
          <form action={signOutAction}>
            <button
              type="submit"
              className="w-full rounded-md px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
