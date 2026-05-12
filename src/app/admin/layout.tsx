import { getAppUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { AdminMobileHeader } from "@/components/admin/AdminMobileHeader"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAppUser()
  if (!user || user.role !== "ADMIN") redirect("/dashboard")

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-60 lg:shrink-0 lg:flex-col lg:border-r lg:bg-background lg:fixed lg:inset-y-0">
        <AdminSidebar />
      </aside>

      {/* Content area */}
      <div className="flex flex-1 flex-col lg:ml-60">
        {/* Mobile header */}
        <AdminMobileHeader />

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
