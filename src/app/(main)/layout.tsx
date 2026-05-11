import { Sidebar } from "@/components/shared/Sidebar"
import { TopNav } from "@/components/shared/TopNav"
import { BottomNav } from "@/components/shared/BottomNav"
import { getAppUser } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await getAppUser()
  if (!user) redirect("/login")

  return (
    <div className="flex h-screen flex-col md:flex-row">
      <div className="hidden md:flex">
        <Sidebar />
      </div>

      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  )
}
