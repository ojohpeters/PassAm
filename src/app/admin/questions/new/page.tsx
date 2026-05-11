import { createAdminClient } from "@/lib/supabase/admin"
import { SingleQuestionForm } from "@/components/admin/SingleQuestionForm"
import { CsvUploadForm } from "@/components/admin/CsvUploadForm"

export default async function NewQuestionPage() {
  const admin = createAdminClient()

  const [{ data: schools }, { data: subjects }] = await Promise.all([
    admin.from("schools").select("id, name").order("name"),
    admin.from("subjects").select("id, name").order("name"),
  ])

  return (
    <div className="space-y-10 p-6">
      <div>
        <h1 className="text-2xl font-bold">Add Questions</h1>
        <p className="text-sm text-muted-foreground">Add a single question or bulk-import via CSV</p>
      </div>

      <section className="space-y-4">
        <h2 className="font-semibold">Single Question</h2>
        <SingleQuestionForm schools={schools ?? []} subjects={subjects ?? []} />
      </section>

      <hr />

      <section className="space-y-4">
        <div>
          <h2 className="font-semibold">Bulk Import (CSV)</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Required columns: <code>text, schoolId, subjectId, optA, optB, optC, optD, correct</code>
            <br />
            Optional: <code>explanation, year</code>
            <br />
            <code>correct</code> must be A, B, C, or D.
          </p>
        </div>
        <CsvUploadForm />
      </section>
    </div>
  )
}
