import { getSubjects } from "@/actions/admin.actions"
import { SubjectsClient } from "./SubjectsClient"
import { redirect } from "next/navigation"
import { getAppUser } from "@/lib/auth"

export default async function SubjectsPage() {
  const user = await getAppUser()
  if (!user || user.role !== "ADMIN") redirect("/dashboard")

  const subjects = await getSubjects()

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Subjects</h1>
        <p className="text-sm text-muted-foreground">Manage all subjects available for questions</p>
      </div>
      <SubjectsClient subjects={subjects ?? []} />
    </div>
  )
}
