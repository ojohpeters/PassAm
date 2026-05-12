"use client"

import { useState, useTransition, useCallback, useEffect, useRef } from "react"
import { getQuestions, deleteQuestions } from "@/actions/admin.actions"
import { toast } from "sonner"
import {
  Trash2, CheckSquare, Square, Loader2, ChevronLeft, ChevronRight,
  Upload, AlertTriangle, X, Hash, Search, Filter
} from "lucide-react"
import { cn } from "@/lib/utils"

type School = { id: string; name: string; abbreviation: string }
type Subject = { id: string; name: string }
type Question = {
  id: string
  text: string
  year: number | null
  school: { abbreviation: string } | null
  subject: { name: string } | null
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function QuestionsClient({
  schools,
  subjects,
}: {
  schools: School[]
  subjects: Subject[]
}) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [schoolId, setSchoolId] = useState("")
  const [subjectId, setSubjectId] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  // CSV bulk delete state
  const [csvPending, startCsvTransition] = useTransition()
  const [csvPreview, setCsvPreview] = useState<string[]>([])
  const [csvFileName, setCsvFileName] = useState("")
  const csvInputRef = useRef<HTMLInputElement>(null)

  // Confirm delete modal
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmIds, setConfirmIds] = useState<string[]>([])
  const [confirmLabel, setConfirmLabel] = useState("")

  const loadQuestions = useCallback(
    (sId: string, subId: string, pg: number) => {
      startTransition(async () => {
        const result = await getQuestions(
          { schoolId: sId || undefined, subjectId: subId || undefined },
          pg,
          20
        )
        if (result) {
          setQuestions(result.questions as unknown as Question[])
          setTotal(result.total)
          setPages(result.pages)
        }
      })
    },
    []
  )

  useEffect(() => {
    loadQuestions(schoolId, subjectId, page)
  }, [schoolId, subjectId, page, loadQuestions])

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === questions.length && questions.length > 0) {
      setSelected(new Set())
    } else {
      setSelected(new Set(questions.map((q) => q.id)))
    }
  }

  function openConfirm(ids: string[], label: string) {
    setConfirmIds(ids)
    setConfirmLabel(label)
    setConfirmOpen(true)
  }

  function handleConfirmedDelete() {
    setConfirmOpen(false)
    startTransition(async () => {
      const result = await deleteQuestions(confirmIds)
      if (result.success) {
        toast.success(`Deleted ${result.data.deleted} question${result.data.deleted !== 1 ? "s" : ""}`)
        setSelected(new Set())
        setCsvPreview([])
        setCsvFileName("")
        loadQuestions(schoolId, subjectId, page)
      } else {
        toast.error("Failed to delete questions")
      }
    })
  }

  function handleCSVUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCsvFileName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const lines = text
        .split("\n")
        .map((l) => l.trim().replace(/^["']|["']$/g, ""))
        .filter(Boolean)
      const ids = lines.filter((l) => UUID_RE.test(l))
      setCsvPreview(ids)
      if (ids.length === 0) {
        toast.error("No valid question IDs found in CSV")
      }
    }
    reader.readAsText(file)
    // Reset file input so same file can be re-uploaded
    e.target.value = ""
  }

  const allOnPageSelected = questions.length > 0 && selected.size === questions.length
  const someSelected = selected.size > 0

  return (
    <div className="space-y-6">
      {/* Floating action bar */}
      {someSelected && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-3 rounded-2xl border bg-background px-5 py-3 shadow-2xl shadow-black/20 ring-1 ring-border">
            <CheckSquare className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">{selected.size} selected</span>
            <div className="h-4 w-px bg-border" />
            <button
              onClick={() => openConfirm(Array.from(selected), `${selected.size} selected question${selected.size !== 1 ? "s" : ""}`)}
              disabled={isPending}
              className="flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-1.5 text-sm font-bold text-white transition-all hover:bg-rose-700 active:scale-[0.98] disabled:opacity-60"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete {selected.size}
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Confirm modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl border bg-background p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950/40">
              <AlertTriangle className="h-6 w-6 text-rose-600" />
            </div>
            <h3 className="mt-4 text-lg font-bold">Delete Questions?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              This will permanently delete <span className="font-semibold text-foreground">{confirmLabel}</span>. This action cannot be undone.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmedDelete}
                disabled={isPending}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-rose-700 disabled:opacity-60"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={schoolId}
            onChange={(e) => { setSchoolId(e.target.value); setPage(1); setSelected(new Set()) }}
            className="bg-transparent text-sm font-medium outline-none"
          >
            <option value="">All Schools</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>{s.abbreviation} — {s.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={subjectId}
            onChange={(e) => { setSubjectId(e.target.value); setPage(1); setSelected(new Set()) }}
            className="bg-transparent text-sm font-medium outline-none"
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        {(schoolId || subjectId) && (
          <button
            onClick={() => { setSchoolId(""); setSubjectId(""); setPage(1); setSelected(new Set()) }}
            className="text-xs font-semibold text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Clear filters
          </button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">{total.toLocaleString()} question{total !== 1 ? "s" : ""}</span>
      </div>

      {/* Question table */}
      <div className="overflow-hidden rounded-2xl border bg-background">
        {/* Table header */}
        <div className="flex items-center gap-3 border-b bg-muted/30 px-4 py-2.5">
          <button onClick={toggleAll} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
            {allOnPageSelected
              ? <CheckSquare className="h-4 w-4 text-primary" />
              : <Square className="h-4 w-4" />
            }
          </button>
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Question</span>
          <span className="ml-auto text-xs font-bold uppercase tracking-wider text-muted-foreground">School / Subject / Year</span>
        </div>

        {isPending ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : questions.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground text-sm">No questions match the current filters</div>
        ) : (
          <div className="divide-y">
            {questions.map((q) => {
              const isSelected = selected.has(q.id)
              return (
                <div
                  key={q.id}
                  onClick={() => toggleSelect(q.id)}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors",
                    isSelected ? "bg-primary/5" : "hover:bg-muted/30"
                  )}
                >
                  <div className="mt-0.5 shrink-0 text-muted-foreground">
                    {isSelected
                      ? <CheckSquare className="h-4 w-4 text-primary" />
                      : <Square className="h-4 w-4" />
                    }
                  </div>
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 mt-0.5">
                    <Hash className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-medium leading-snug">{q.text}</p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {(q.school as any)?.abbreviation && (
                        <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                          {(q.school as any).abbreviation}
                        </span>
                      )}
                      {(q.subject as any)?.name && (
                        <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {(q.subject as any).name}
                        </span>
                      )}
                      {q.year && (
                        <span className="text-[10px] text-muted-foreground">{q.year}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isPending}
              className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <span className="text-sm text-muted-foreground">Page {page} of {pages}</span>
            <button
              onClick={() => setPage((p) => Math.min(pages, p + 1))}
              disabled={page === pages || isPending}
              className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* CSV Bulk Delete */}
      <div className="rounded-2xl border bg-background p-5 space-y-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Bulk Delete by CSV</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Upload a CSV file with one question ID per line (UUID format). A header row named <code className="font-mono text-xs">id</code> is automatically skipped.
          </p>
        </div>

        <div
          onClick={() => csvInputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/25 px-6 py-8 transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          <Upload className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm font-semibold text-muted-foreground">Click to upload CSV</p>
          {csvFileName && (
            <p className="text-xs text-primary font-medium">{csvFileName}</p>
          )}
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleCSVUpload}
            className="hidden"
          />
        </div>

        {csvPreview.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">
                <span className="text-primary">{csvPreview.length}</span> valid IDs found
              </p>
              <button
                onClick={() => { setCsvPreview([]); setCsvFileName("") }}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
              >
                Clear
              </button>
            </div>
            <div className="max-h-32 overflow-y-auto rounded-xl bg-muted/40 p-3 font-mono text-xs space-y-0.5">
              {csvPreview.slice(0, 20).map((id) => (
                <div key={id} className="text-muted-foreground truncate">{id}</div>
              ))}
              {csvPreview.length > 20 && (
                <div className="text-muted-foreground/60">…and {csvPreview.length - 20} more</div>
              )}
            </div>
            <button
              onClick={() => openConfirm(csvPreview, `${csvPreview.length} question${csvPreview.length !== 1 ? "s" : ""} from CSV`)}
              disabled={csvPending || isPending}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-rose-700 active:scale-[0.98] disabled:opacity-60"
            >
              {csvPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete {csvPreview.length} Questions from CSV
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
