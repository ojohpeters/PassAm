import { getAppUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { getDailyDrill } from "@/actions/drill.actions"
import { DrillShell } from "@/components/drill/DrillShell"
import Link from "next/link"
import { Zap } from "lucide-react"

export const metadata = { title: "Timed Drill — PrepIQ" }
export const dynamic = "force-dynamic"

export default async function DrillSessionPage() {
  const user = await getAppUser()
  if (!user) redirect("/login")

  const result = await getDailyDrill()

  if (!result.success) {
    if (result.error === "NO_QUESTIONS") {
      return (
        <div className="flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-950/40">
            <Zap className="h-8 w-8 text-orange-500" />
          </div>
          <div>
            <h2 className="text-lg font-black">No questions available yet</h2>
            <p className="mt-1 text-sm text-muted-foreground max-w-xs">
              Your target school hasn&apos;t had questions uploaded yet. Try setting a different school in your profile.
            </p>
          </div>
          <Link href="/profile" className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90">
            Update Profile
          </Link>
        </div>
      )
    }
    redirect("/drill")
  }

  return <DrillShell drill={result.data} />
}
