import { getAppUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getLogAttendants } from "@/actions/brainstorm.actions"
import { LogAttendantsClient } from "./LogAttendantsClient"
import { ClipboardList } from "lucide-react"

export const metadata = { title: "Log Attendants" }

export default async function LogAttendantsPage() {
  const user = await getAppUser()
  if (!user || user.role !== "ADMIN") redirect("/dashboard")

  const attendants = await getLogAttendants()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
          <ClipboardList className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-black">Log Attendants</h1>
          <p className="text-sm text-muted-foreground">
            {attendants.length} attendant{attendants.length !== 1 ? "s" : ""} — can log daily brainstorm sessions
          </p>
        </div>
      </div>

      <div className="rounded-2xl border bg-muted/20 px-5 py-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-bold text-foreground">Log attendants</span> have access to the Brainstorm Sessions page where they can add participating students and track how many questions each student answered first in the daily WhatsApp group session.
        </p>
      </div>

      <LogAttendantsClient initialAttendants={attendants} />
    </div>
  )
}
