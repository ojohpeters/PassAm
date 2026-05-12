import { createAdminClient } from "@/lib/supabase/admin"
import { SingleQuestionForm } from "@/components/admin/SingleQuestionForm"
import { CsvUploadForm } from "@/components/admin/CsvUploadForm"
import { CsvTemplateButton } from "@/components/admin/CsvTemplateButton"
import { CheckCircle, AlertTriangle, Download, FileText, Copy } from "lucide-react"
import Link from "next/link"

export default async function NewQuestionPage() {
  const admin = createAdminClient()

  const [{ data: schools }, { data: subjects }] = await Promise.all([
    admin.from("schools").select("id, name, abbreviation").order("name"),
    admin.from("subjects").select("id, name").order("name"),
  ])

  const columns = [
    { col: "text",        req: true,  desc: "Full question text",                    ex: "What is the speed of light?" },
    { col: "schoolId",    req: true,  desc: "School UUID (copy from table below)",    ex: "uuid-here" },
    { col: "subjectId",   req: true,  desc: "Subject UUID (copy from table below)",   ex: "uuid-here" },
    { col: "optA",        req: true,  desc: "Option A text",                          ex: "300,000 km/s" },
    { col: "optB",        req: true,  desc: "Option B text",                          ex: "150,000 km/s" },
    { col: "optC",        req: true,  desc: "Option C text",                          ex: "500,000 km/s" },
    { col: "optD",        req: true,  desc: "Option D text",                          ex: "1,000 km/s" },
    { col: "correct",     req: true,  desc: "Correct option letter — A, B, C, or D", ex: "A" },
    { col: "explanation", req: false, desc: "Why that answer is correct",             ex: "Light travels at 3×10⁸ m/s" },
    { col: "year",        req: false, desc: "Exam year this appeared",                ex: "2022" },
  ]

  const steps = [
    { n: "1", title: "Download the template", body: 'Click "Download Template" and open it in Excel or Google Sheets.' },
    { n: "2", title: "Copy IDs from below",   body: "Each school and subject has a UUID. Copy the right ones into your spreadsheet." },
    { n: "3", title: "Fill in one row per question", body: "Don't rename column headers. Wrap text with commas in double quotes." },
    { n: "4", title: "Export as CSV & upload", body: "Google Sheets → File → Download → CSV. Excel → Save As → CSV UTF-8." },
  ]

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-1">
            <Link href="/admin/questions" className="text-xs font-semibold text-muted-foreground hover:text-foreground">
              ← Questions
            </Link>
          </div>
          <h1 className="text-2xl font-black tracking-tight">Add Questions</h1>
          <p className="text-sm text-muted-foreground">Add one question or bulk-import hundreds via CSV</p>
        </div>
      </div>

      {/* ── Single question ── */}
      <section className="rounded-2xl border bg-background p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
            <FileText className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-base leading-tight">Single Question</h2>
            <p className="text-xs text-muted-foreground">Fill in the form and save</p>
          </div>
        </div>
        <SingleQuestionForm schools={schools ?? []} subjects={subjects ?? []} />
      </section>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
        <div className="relative flex justify-center">
          <span className="bg-muted/30 px-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">or bulk import</span>
        </div>
      </div>

      {/* ── CSV import ── */}
      <section className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/40">
              <Download className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="font-bold text-base leading-tight">Bulk Import via CSV</h2>
              <p className="text-xs text-muted-foreground">Upload hundreds at once</p>
            </div>
          </div>
          <CsvTemplateButton />
        </div>

        {/* Steps */}
        <div className="rounded-2xl border bg-background p-5 space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">How it works</p>
          <ol className="space-y-4">
            {steps.map((s) => (
              <li key={s.n} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-black text-primary-foreground">
                  {s.n}
                </span>
                <div>
                  <p className="text-sm font-semibold leading-tight">{s.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Column reference */}
        <div className="overflow-hidden rounded-2xl border bg-background">
          <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-3">
            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Column Reference</p>
          </div>
          <div className="divide-y">
            {columns.map((row) => (
              <div key={row.col} className="flex items-start gap-3 px-4 py-2.5">
                <code className="shrink-0 rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary">{row.col}</code>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs text-muted-foreground">{row.desc}</p>
                    {row.req
                      ? <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400"><CheckCircle className="h-2.5 w-2.5" /> required</span>
                      : <span className="text-[10px] text-muted-foreground">optional</span>
                    }
                  </div>
                  <p className="mt-0.5 font-mono text-[11px] text-muted-foreground/70">e.g. {row.ex}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* School IDs */}
        <div className="overflow-hidden rounded-2xl border bg-background">
          <div className="border-b bg-muted/30 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">School IDs — select all to copy</p>
          </div>
          <div className="divide-y">
            {(schools ?? []).map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="text-sm font-semibold">{s.name}
                  <span className="ml-1.5 rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">{s.abbreviation}</span>
                </span>
                <code className="select-all rounded-lg border bg-muted px-2 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:bg-primary/5">{s.id}</code>
              </div>
            ))}
          </div>
        </div>

        {/* Subject IDs */}
        <div className="overflow-hidden rounded-2xl border bg-background">
          <div className="border-b bg-muted/30 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Subject IDs — select all to copy</p>
          </div>
          <div className="grid grid-cols-1 divide-y sm:grid-cols-2">
            {(subjects ?? []).map((s, i) => (
              <div key={s.id} className={`flex items-center justify-between gap-3 px-4 py-2.5 ${i % 2 === 1 ? "sm:border-l" : ""} ${i >= 2 ? "border-t" : ""}`}>
                <span className="text-sm font-semibold">{s.name}</span>
                <code className="select-all rounded-lg border bg-muted px-2 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:bg-primary/5">{s.id}</code>
              </div>
            ))}
          </div>
        </div>

        {/* Warnings */}
        <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="space-y-1 text-sm text-amber-700 dark:text-amber-400">
            <p className="font-bold">Common mistakes</p>
            <ul className="space-y-0.5 text-xs">
              <li>• <strong>correct</strong> must be uppercase: <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/40">A</code>, <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/40">B</code>, <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/40">C</code>, or <code className="rounded bg-amber-100 px-1 dark:bg-amber-900/40">D</code></li>
              <li>• Always copy IDs from above — never type them manually</li>
              <li>• Don't rename or add columns</li>
              <li>• Text with commas must be wrapped in double quotes</li>
              <li>• Delete empty rows at the bottom before exporting</li>
            </ul>
          </div>
        </div>

        {/* Upload */}
        <div className="rounded-2xl border bg-background p-5 space-y-3">
          <h3 className="font-bold text-sm">Upload your CSV</h3>
          <CsvUploadForm />
        </div>
      </section>
    </div>
  )
}
