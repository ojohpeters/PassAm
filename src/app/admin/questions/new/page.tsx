import { createAdminClient } from "@/lib/supabase/admin"
import { SingleQuestionForm } from "@/components/admin/SingleQuestionForm"
import { CsvUploadForm } from "@/components/admin/CsvUploadForm"
import { CsvTemplateButton } from "@/components/admin/CsvTemplateButton"
import { CheckCircle, AlertCircle, Info } from "lucide-react"

export default async function NewQuestionPage() {
  const admin = createAdminClient()

  const [{ data: schools }, { data: subjects }] = await Promise.all([
    admin.from("schools").select("id, name, abbreviation").order("name"),
    admin.from("subjects").select("id, name").order("name"),
  ])

  return (
    <div className="max-w-4xl space-y-10 p-6">

      <div>
        <h1 className="text-2xl font-black tracking-tight">Add Questions</h1>
        <p className="text-sm text-muted-foreground">Add one question at a time or bulk-import hundreds via CSV</p>
      </div>

      {/* ── Single question ── */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold">Single Question</h2>
        <SingleQuestionForm schools={schools ?? []} subjects={subjects ?? []} />
      </section>

      <div className="border-t" />

      {/* ── Bulk CSV import ── */}
      <section className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">Bulk Import via CSV</h2>
            <p className="text-sm text-muted-foreground">Upload hundreds of questions at once from a spreadsheet</p>
          </div>
          <CsvTemplateButton />
        </div>

        {/* Step guide */}
        <div className="rounded-2xl border bg-background p-5 space-y-4">
          <p className="text-sm font-bold flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            Step-by-step guide
          </p>
          <ol className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">1</span>
              <div>
                <p className="font-semibold text-foreground">Download the template</p>
                <p>Click &ldquo;Download Template CSV&rdquo; above. Open it in Excel, Google Sheets, or any spreadsheet app.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">2</span>
              <div>
                <p className="font-semibold text-foreground">Copy the IDs from the tables below</p>
                <p>Each school and subject has a unique ID (UUID). Copy the correct ones into your spreadsheet.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">3</span>
              <div>
                <p className="font-semibold text-foreground">Fill in the questions</p>
                <p>One question per row. Follow the column format exactly — do not rename column headers.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-black text-primary">4</span>
              <div>
                <p className="font-semibold text-foreground">Export as CSV and upload</p>
                <p>In Google Sheets: File → Download → CSV. In Excel: Save As → CSV UTF-8.</p>
              </div>
            </li>
          </ol>
        </div>

        {/* Column reference */}
        <div className="rounded-2xl border bg-background overflow-hidden">
          <div className="border-b bg-muted/30 px-5 py-3">
            <p className="text-sm font-bold">Column Reference</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/20">
                  <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Column</th>
                  <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Required</th>
                  <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</th>
                  <th className="px-4 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Example</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {[
                  { col: "text",       req: true,  desc: "The full question text",                  ex: "What is the speed of light?" },
                  { col: "schoolId",   req: true,  desc: "UUID of the school (see table below)",     ex: "abc-123..." },
                  { col: "subjectId",  req: true,  desc: "UUID of the subject (see table below)",    ex: "def-456..." },
                  { col: "optA",       req: true,  desc: "Text for option A",                        ex: "300,000 km/s" },
                  { col: "optB",       req: true,  desc: "Text for option B",                        ex: "150,000 km/s" },
                  { col: "optC",       req: true,  desc: "Text for option C",                        ex: "500,000 km/s" },
                  { col: "optD",       req: true,  desc: "Text for option D",                        ex: "1,000 km/s" },
                  { col: "correct",    req: true,  desc: "Letter of the correct option (A, B, C, D)",ex: "A" },
                  { col: "explanation",req: false, desc: "Why that answer is correct (optional)",    ex: "Light travels at ~3×10⁸ m/s" },
                  { col: "year",       req: false, desc: "Exam year this question appeared (optional)",ex: "2021" },
                ].map((row) => (
                  <tr key={row.col} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5 font-mono text-xs font-bold text-primary">{row.col}</td>
                    <td className="px-4 py-2.5">
                      {row.req
                        ? <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400"><CheckCircle className="h-3 w-3" /> Yes</span>
                        : <span className="text-xs text-muted-foreground">Optional</span>
                      }
                    </td>
                    <td className="px-4 py-2.5 text-sm text-muted-foreground">{row.desc}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{row.ex}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* School IDs */}
        <div className="rounded-2xl border bg-background overflow-hidden">
          <div className="border-b bg-muted/30 px-5 py-3">
            <p className="text-sm font-bold">School IDs — copy the ID for the school you&apos;re adding questions for</p>
          </div>
          <div className="divide-y">
            {(schools ?? []).map((s) => (
              <div key={s.id} className="flex items-center justify-between px-5 py-2.5">
                <span className="text-sm font-semibold">{s.name} <span className="text-muted-foreground">({s.abbreviation})</span></span>
                <code className="select-all rounded bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">{s.id}</code>
              </div>
            ))}
          </div>
        </div>

        {/* Subject IDs */}
        <div className="rounded-2xl border bg-background overflow-hidden">
          <div className="border-b bg-muted/30 px-5 py-3">
            <p className="text-sm font-bold">Subject IDs — copy the ID for the subject of each question</p>
          </div>
          <div className="grid grid-cols-1 divide-y sm:grid-cols-2 sm:divide-y-0">
            {(subjects ?? []).map((s, i) => (
              <div key={s.id} className={`flex items-center justify-between px-5 py-2.5 ${i % 2 === 1 ? "sm:border-l" : ""}`}>
                <span className="text-sm font-semibold">{s.name}</span>
                <code className="select-all rounded bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">{s.id}</code>
              </div>
            ))}
          </div>
        </div>

        {/* Common errors */}
        <div className="rounded-2xl border border-orange-200 bg-orange-50 p-5 dark:border-orange-900/40 dark:bg-orange-950/30">
          <p className="flex items-center gap-2 text-sm font-bold text-orange-700 dark:text-orange-400">
            <AlertCircle className="h-4 w-4" />
            Common errors to avoid
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-orange-700/80 dark:text-orange-400/80">
            <li>• <strong>wrong ID</strong> — always copy IDs from the tables above, don't type them manually</li>
            <li>• <strong>correct = "a"</strong> (lowercase) — must be uppercase: A, B, C, or D</li>
            <li>• <strong>extra columns</strong> — do not add extra columns or change column names</li>
            <li>• <strong>missing quotes</strong> — if question text has commas, wrap the cell in double quotes in your CSV</li>
            <li>• <strong>empty rows</strong> — remove blank rows at the bottom of your spreadsheet before exporting</li>
          </ul>
        </div>

        {/* Upload form */}
        <div>
          <h3 className="mb-3 font-semibold">Upload your CSV</h3>
          <CsvUploadForm />
        </div>

      </section>
    </div>
  )
}
