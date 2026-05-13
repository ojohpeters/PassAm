import { getAppUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getBrainstormHosts } from "@/actions/brainstorm.actions"
import { BrainstormHostsClient } from "./BrainstormHostsClient"
import { Radio } from "lucide-react"

export const metadata = { title: "Brainstorm Hosts" }

export default async function BrainstormHostsPage() {
  const user = await getAppUser()
  if (!user || user.role !== "ADMIN") redirect("/dashboard")

  const hosts = await getBrainstormHosts()

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10">
          <Radio className="h-6 w-6 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black">Brainstorm Hosts</h1>
          <p className="text-sm text-muted-foreground">
            {hosts.length} host{hosts.length !== 1 ? "s" : ""} — can run live brainstorm sessions
          </p>
        </div>
      </div>

      <div className="rounded-2xl border bg-muted/20 px-5 py-4">
        <p className="text-sm text-muted-foreground">
          <span className="font-bold text-foreground">Brainstorm Hosts</span> can start live sessions, push questions
          to students in real time, and manage the session flow. Hosts do not have full admin access.
          You can disable a host without removing them.
        </p>
      </div>

      <BrainstormHostsClient initialHosts={hosts} />
    </div>
  )
}
