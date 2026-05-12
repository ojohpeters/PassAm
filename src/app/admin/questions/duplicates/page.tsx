import { findDuplicateQuestions } from "@/actions/admin.actions"
import { getAppUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { DuplicatesClient } from "./DuplicatesClient"
import { Copy } from "lucide-react"

const PAGE_SIZE = 20

export default async function DuplicatesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; school?: string }>
}) {
  const user = await getAppUser()
  if (!user || user.role !== "ADMIN") redirect("/dashboard")

  const params = await searchParams
  const page = Math.max(1, parseInt(params.page ?? "1", 10))
  const schoolId = params.school ?? undefined

  const admin = createAdminClient()
  const { data: schools } = await admin
    .from("schools")
    .select("id, name, abbreviation")
    .neq("abbreviation", "GENERAL")
    .order("abbreviation")

  const { groups, total } = await findDuplicateQuestions(schoolId, page, PAGE_SIZE)
  const totalPages = Math.ceil(total / PAGE_SIZE)
  const totalDuplicates = groups.reduce((sum, g) => sum + g.questions.length - 1, 0)

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Duplicate Questions</h1>
          <p className="text-sm text-muted-foreground">
            {total === 0
              ? schoolId
                ? "No duplicates within this school."
                : "No duplicates found — question bank is clean."
              : `${total} duplicate group${total !== 1 ? "s" : ""} · ${totalDuplicates} redundant on this page`}
          </p>
        </div>
        {total > 0 && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
            <Copy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
        )}
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-background py-20 text-center">
          <span className="text-5xl mb-4">✅</span>
          <h2 className="text-xl font-black">All clean!</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-sm">
            {schoolId
              ? "No duplicate questions found within the selected school."
              : "No duplicate questions detected in the bank."}
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border bg-amber-50/50 border-amber-200/60 px-4 py-3 text-xs text-amber-800 dark:bg-amber-950/30 dark:border-amber-800/40 dark:text-amber-300">
            <strong>How this works:</strong> Questions are compared after stripping punctuation and normalising case.
            &ldquo;Keep oldest&rdquo; retains the first-uploaded copy and deletes the rest.
            Filter by school to clean intra-school duplicates only — cross-school copies are often intentional.
          </div>
          <DuplicatesClient
            groups={groups}
            schools={schools ?? []}
            currentSchoolId={schoolId}
            currentPage={page}
            totalPages={totalPages}
            total={total}
          />
        </>
      )}
    </div>
  )
}
