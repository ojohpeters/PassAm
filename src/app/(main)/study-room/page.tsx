import { getAppUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { StudyRoomClient } from "@/components/study-room/StudyRoomClient"
import { BookOpen } from "lucide-react"

export const metadata = { title: "Study Room — PrepIQ" }

export default async function StudyRoomPage() {
  const user = await getAppUser()
  if (!user) redirect("/login")

  return (
    <div className="mx-auto max-w-lg p-4 pb-24 md:p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-950/40">
          <BookOpen className="h-6 w-6 text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight">Study Room</h1>
          <p className="text-xs text-muted-foreground">Your personal focus space</p>
        </div>
      </div>

      <StudyRoomClient />
    </div>
  )
}
