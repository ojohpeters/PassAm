import { getCommunityMembers } from "@/actions/community.actions"
import { getAppUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CommunityClient } from "./CommunityClient"
import { Users, Lightbulb, ChevronRight } from "lucide-react"
import Link from "next/link"

export const metadata = { title: "Community" }

export default async function CommunityPage() {
  const user = await getAppUser()
  if (!user) redirect("/login")

  const members = await getCommunityMembers()

  return (
    <div className="min-h-full space-y-6 p-4 pb-24 md:p-6">

      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-6 text-white">
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-8 left-1/2 h-32 w-64 rounded-full bg-white/5" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20">
            <Users className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">PrepIQ Community</h1>
            <p className="mt-0.5 text-sm text-white/75">
              {members.length} student{members.length !== 1 ? "s" : ""} sharing their contact
            </p>
          </div>
        </div>
        <p className="relative mt-4 text-sm leading-relaxed text-white/80 max-w-lg">
          Connect with fellow students preparing for POST-UTME. Members who opt in share their WhatsApp so you can study together.
        </p>
        <div className="relative mt-4 flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 backdrop-blur-sm max-w-sm">
          <span className="text-base">💡</span>
          <p className="text-xs font-semibold text-white/90">
            Set your WhatsApp in <span className="font-black text-white">Profile → Community</span> to appear here
          </p>
        </div>
      </div>

      {/* Brainstorm Sessions link */}
      <Link
        href="/community/brainstorm"
        className="flex items-center gap-4 rounded-2xl border bg-gradient-to-r from-amber-50 to-orange-50 p-4 transition-all hover:shadow-md hover:-translate-y-0.5 dark:from-amber-950/20 dark:to-orange-950/20"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-sm">
          <Lightbulb className="h-6 w-6 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-black text-base">Brainstorm Sessions</p>
          <p className="text-sm text-muted-foreground">Daily WhatsApp group leaderboard</p>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
      </Link>

      <CommunityClient members={members} currentUserId={user.id} />
    </div>
  )
}
