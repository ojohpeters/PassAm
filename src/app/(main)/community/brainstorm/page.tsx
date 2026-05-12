import { getAppUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import {
  isLogAttendant,
  getOrCreateTodaySession,
  getSessionAttendance,
  getAllSessionDates,
} from "@/actions/brainstorm.actions"
import { BrainstormClient } from "./BrainstormClient"
import { Lightbulb } from "lucide-react"

export const metadata = { title: "Brainstorm Sessions" }

export default async function BrainstormPage() {
  const user = await getAppUser()
  if (!user) redirect("/login")

  const canLog = await isLogAttendant()

  // Get or create today's session for attendants; just get it for others
  let sessionId: string | null = null
  let sessionDate: string | null = null

  if (canLog) {
    const res = await getOrCreateTodaySession()
    if (res.success) {
      sessionId = res.data.id
      sessionDate = res.data.session_date
    }
  } else {
    // Students just see the leaderboard — get most recent session
    const dates = await getAllSessionDates()
    if (dates.length > 0) {
      const { getSession } = await import("@/actions/brainstorm.actions")
      const session = await getSession(dates[0])
      sessionId = session?.id ?? null
      sessionDate = dates[0]
    }
  }

  const attendance = sessionId ? await getSessionAttendance(sessionId) : []
  const allDates = await getAllSessionDates()

  return (
    <div className="min-h-full space-y-6 p-4 pb-24 md:p-6">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-600 p-6 text-white">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20">
            <Lightbulb className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">Brainstorm Sessions</h1>
            <p className="text-sm text-white/75">Daily WhatsApp group session leaderboard</p>
          </div>
        </div>
        <p className="relative mt-3 text-sm leading-relaxed text-white/80 max-w-lg">
          Every day, students compete to answer questions first in the PrepIQ WhatsApp group.
          Log attendants track who&apos;s active and how many questions each student answered first.
        </p>
        {!canLog && (
          <div className="relative mt-4 flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur-sm max-w-sm">
            <span>💬</span>
            <p className="text-xs font-semibold text-white/90">
              Join the WhatsApp group to participate — link in About & Help
            </p>
          </div>
        )}
      </div>

      <BrainstormClient
        canLog={canLog}
        sessionId={sessionId}
        sessionDate={sessionDate}
        initialAttendance={attendance}
        allDates={allDates}
        currentUserId={user.id}
      />
    </div>
  )
}
