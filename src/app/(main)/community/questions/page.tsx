import { getCommunityQuestions } from "@/actions/user-questions.actions"
import { getAppUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { CommunityQuestionsClient } from "./CommunityQuestionsClient"
import { Globe } from "lucide-react"

export const metadata = { title: "Community Questions" }

export default async function CommunityQuestionsPage() {
  const user = await getAppUser()
  if (!user) redirect("/login")

  const result = await getCommunityQuestions()
  const data   = result.success ? result.data    : []
  const total  = result.success ? result.total   : 0
  const subjects = result.success ? result.subjects : []

  return (
    <div className="min-h-full space-y-5 p-4 pb-24 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-4 rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-5 text-white">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20">
          <Globe className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight">Community Questions</h1>
          <p className="mt-0.5 text-sm text-white/75">
            {total.toLocaleString()} question{total !== 1 ? "s" : ""} shared by students
          </p>
        </div>
      </div>

      <CommunityQuestionsClient initialData={data} initialTotal={total} subjects={subjects} />
    </div>
  )
}
