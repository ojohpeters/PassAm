"use client"

import { useState, useTransition, useCallback, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import type { AttendanceRow } from "@/actions/brainstorm.actions"
import {
  addStudentToSession,
  updateFirstAnswers,
  removeFromSession,
  searchStudents,
  getSessionAttendance,
  getSession,
} from "@/actions/brainstorm.actions"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Minus,
  Plus,
  Search,
  Trash2,
  UserPlus,
  X,
} from "lucide-react"

const PER_PAGE = 15

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
}

function formatDate(dateStr: string) {
  const today = new Date().toISOString().split("T")[0]
  if (dateStr === today) return "Today"
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-NG", { weekday: "short", month: "short", day: "numeric" })
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-xs font-black text-white shadow-sm">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} className="h-full w-full object-cover" />
      ) : (
        initials(name)
      )}
    </div>
  )
}

const RANK_STYLES: Record<number, { bg: string; border: string; medal: string; scoreBg: string; scoreText: string }> = {
  1: { bg: "bg-yellow-50 dark:bg-yellow-900/20",   border: "border-l-4 border-l-yellow-400", medal: "🥇", scoreBg: "bg-yellow-200 dark:bg-yellow-800", scoreText: "text-yellow-900 dark:text-yellow-100" },
  2: { bg: "bg-slate-50 dark:bg-slate-900/30",     border: "border-l-4 border-l-slate-400",  medal: "🥈", scoreBg: "bg-slate-200 dark:bg-slate-700",  scoreText: "text-slate-800 dark:text-slate-100"  },
  3: { bg: "bg-orange-50 dark:bg-orange-900/20",   border: "border-l-4 border-l-orange-400", medal: "🥉", scoreBg: "bg-orange-200 dark:bg-orange-800", scoreText: "text-orange-900 dark:text-orange-100" },
}

type SearchStudent = {
  id: string
  name: string
  avatar_url: string | null
  target_school: string | null
}

export function BrainstormClient({
  canLog,
  sessionId: initialSessionId,
  sessionDate: initialSessionDate,
  initialAttendance,
  allDates,
  currentUserId,
}: {
  canLog: boolean
  sessionId: string | null
  sessionDate: string | null
  initialAttendance: AttendanceRow[]
  allDates: string[]
  currentUserId: string
}) {
  const today = new Date().toISOString().split("T")[0]

  const [selectedDate, setSelectedDate] = useState(
    initialSessionDate ?? (allDates[0] ?? null)
  )
  const [sessionId, setSessionId] = useState(initialSessionId)
  const [attendance, setAttendance] = useState<AttendanceRow[]>(
    [...initialAttendance].sort((a, b) => b.first_answers - a.first_answers)
  )
  const [loadingDate, startDateTransition] = useTransition()
  const [, startMutation] = useTransition()

  // Add student modal
  const [addOpen, setAddOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchStudent[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [searching, setSearching] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Date navigation ──────────────────────────────────────────────────────────

  function handleDateChange(date: string) {
    if (date === selectedDate || loadingDate) return
    setSelectedDate(date)
    startDateTransition(async () => {
      const session = await getSession(date)
      if (!session) {
        setSessionId(null)
        setAttendance([])
        return
      }
      setSessionId(session.id)
      const rows = await getSessionAttendance(session.id)
      setAttendance([...rows].sort((a, b) => b.first_answers - a.first_answers))
    })
  }

  // ── Student search ───────────────────────────────────────────────────────────

  const doSearch = useCallback(async (q: string, p: number) => {
    setSearching(true)
    const res = await searchStudents(q, p, PER_PAGE)
    setResults(res.students as SearchStudent[])
    setTotal(res.total)
    setPage(p)
    setSearching(false)
  }, [])

  useEffect(() => {
    if (!addOpen) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(query, 1), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, addOpen, doSearch])

  useEffect(() => {
    if (addOpen) {
      setQuery("")
      setPage(1)
      doSearch("", 1)
    }
  }, [addOpen, doSearch])

  // ── Mutations ────────────────────────────────────────────────────────────────

  async function handleAdd(studentId: string) {
    if (!sessionId) return
    setAddingId(studentId)
    const res = await addStudentToSession(sessionId, studentId)
    setAddingId(null)
    if (res.success) {
      setAttendance((prev) =>
        [...prev, res.data].sort((a, b) => b.first_answers - a.first_answers)
      )
    }
  }

  function handleUpdateCount(row: AttendanceRow, delta: number) {
    const newCount = Math.max(0, row.first_answers + delta)
    setAttendance((prev) =>
      prev.map((r) => (r.id === row.id ? { ...r, first_answers: newCount } : r))
        .sort((a, b) => b.first_answers - a.first_answers)
    )
    startMutation(async () => {
      await updateFirstAnswers(row.id, newCount)
    })
  }

  function handleRemove(attendanceId: string) {
    setAttendance((prev) => prev.filter((r) => r.id !== attendanceId))
    startMutation(async () => {
      await removeFromSession(attendanceId)
    })
  }

  const addedIds = new Set(attendance.map((r) => r.student_id))
  const isToday = selectedDate === today

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* Date selector */}
      {allDates.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {allDates.map((date) => (
            <button
              key={date}
              onClick={() => handleDateChange(date)}
              disabled={loadingDate}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-all",
                selectedDate === date
                  ? "bg-amber-500 text-white shadow-sm shadow-amber-500/30"
                  : "border bg-background text-muted-foreground hover:border-amber-400/50 hover:text-foreground"
              )}
            >
              <Calendar className="h-3 w-3" />
              {formatDate(date)}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loadingDate && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500/50" />
        </div>
      )}

      {/* No session */}
      {!loadingDate && !sessionId && (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-16 text-center">
          <span className="text-4xl">📭</span>
          <h3 className="mt-3 font-bold">No session recorded</h3>
          <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
            {canLog
              ? "A session will be created when you add the first student."
              : "No brainstorm session was logged for this date."}
          </p>
        </div>
      )}

      {/* Session content */}
      {!loadingDate && sessionId && (
        <div className="space-y-4">

          {/* Attendant: add student */}
          {canLog && isToday && (
            <button
              onClick={() => setAddOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-amber-300 py-3 text-sm font-bold text-amber-600 transition-all hover:bg-amber-50 active:scale-[0.99] dark:hover:bg-amber-950/20"
            >
              <UserPlus className="h-4 w-4" />
              Add Student to Session
            </button>
          )}

          {/* Empty state */}
          {attendance.length === 0 && (
            <div className="flex flex-col items-center py-16 text-center">
              <span className="text-4xl">🔥</span>
              <h3 className="mt-3 font-bold">No participants yet</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                {canLog && isToday
                  ? "Use the button above to add students."
                  : "No students were logged for this session."}
              </p>
            </div>
          )}

          {/* Ranked list */}
          {attendance.length > 0 && (
            <div className="overflow-hidden rounded-2xl border bg-background">
              {/* Header */}
              <div className="flex items-center gap-3 border-b bg-muted/30 px-4 py-2.5">
                <span className="w-8 text-center text-[10px] font-black uppercase tracking-wider text-muted-foreground">Rank</span>
                <span className="flex-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Student</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  {canLog && isToday ? "1st Answers" : "Score"}
                </span>
              </div>

              <div className="divide-y">
                {attendance.map((row, idx) => {
                  const rank = idx + 1
                  const style = RANK_STYLES[rank]
                  return (
                    <div
                      key={row.id}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 transition-colors",
                        style?.bg,
                        style?.border,
                        row.student_id === currentUserId && !style?.bg && "bg-amber-50/40 dark:bg-amber-950/10"
                      )}
                    >
                      {/* Rank */}
                      <div className="flex w-8 shrink-0 items-center justify-center">
                        {style ? (
                          <span className="text-xl leading-none">{style.medal}</span>
                        ) : (
                          <span className="text-xs font-black text-muted-foreground">#{rank}</span>
                        )}
                      </div>

                      {/* Avatar */}
                      <Avatar
                        name={row.student?.name ?? "?"}
                        url={row.student?.avatar_url ?? null}
                      />

                      {/* Name */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold">
                          {row.student?.name ?? "Unknown"}
                          {row.student_id === currentUserId && (
                            <span className="ml-1.5 text-[10px] font-semibold text-muted-foreground">(you)</span>
                          )}
                        </p>
                        {row.student?.target_school && (
                          <p className="text-[11px] text-muted-foreground truncate">{row.student.target_school}</p>
                        )}
                      </div>

                      {/* Controls or score */}
                      {canLog && isToday ? (
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-0.5 rounded-xl border bg-background/80 p-1 shadow-sm">
                            <button
                              onClick={() => handleUpdateCount(row, -1)}
                              disabled={row.first_answers === 0}
                              className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="min-w-[2.25rem] text-center text-sm font-black">
                              {row.first_answers}
                            </span>
                            <button
                              onClick={() => handleUpdateCount(row, 1)}
                              className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <button
                            onClick={() => handleRemove(row.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg text-rose-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className={cn(
                          "flex items-center gap-1 rounded-xl px-3 py-1.5",
                          style?.scoreBg ?? "bg-amber-100 dark:bg-amber-900/30"
                        )}>
                          <span className={cn(
                            "text-sm font-black",
                            style?.scoreText ?? "text-amber-700 dark:text-amber-300"
                          )}>
                            {row.first_answers}
                          </span>
                          <span className="text-[10px] font-semibold opacity-60">pts</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Session meta */}
          {attendance.length > 0 && (
            <p className="text-center text-xs text-muted-foreground">
              {attendance.length} participant{attendance.length !== 1 ? "s" : ""} ·{" "}
              {attendance.reduce((s, r) => s + r.first_answers, 0)} total first answers
            </p>
          )}
        </div>
      )}

      {/* ── Add student modal ─────────────────────────────────────────────────── */}
      {addOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setAddOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[78vh] flex-col rounded-t-3xl border-t bg-background shadow-2xl md:inset-0 md:m-auto md:h-auto md:max-h-[80vh] md:max-w-md md:rounded-2xl md:border">

            {/* Header */}
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h3 className="font-black">Add Student</h3>
                <p className="text-xs text-muted-foreground">Select a student to log for today&apos;s session</p>
              </div>
              <button
                onClick={() => setAddOpen(false)}
                className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search input */}
            <div className="border-b px-4 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search students by name…"
                  className="w-full rounded-xl border bg-muted/30 py-2.5 pl-9 pr-4 text-sm outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20"
                />
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto">
              {searching ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-amber-500/50" />
                </div>
              ) : results.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <Search className="mb-2 h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm font-semibold text-muted-foreground">No students found</p>
                </div>
              ) : (
                <div className="divide-y">
                  {results.map((s) => {
                    const added = addedIds.has(s.id)
                    return (
                      <div key={s.id} className="flex items-center gap-3 px-5 py-3">
                        <Avatar name={s.name} url={s.avatar_url} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold">{s.name}</p>
                          {s.target_school && (
                            <p className="text-[11px] text-muted-foreground">{s.target_school}</p>
                          )}
                        </div>
                        {added ? (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                            Added ✓
                          </span>
                        ) : (
                          <button
                            disabled={addingId === s.id}
                            onClick={() => handleAdd(s.id)}
                            className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-amber-600 disabled:opacity-60 active:scale-[0.97]"
                          >
                            {addingId === s.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Plus className="h-3 w-3" />
                            )}
                            Add
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Pagination */}
            {total > PER_PAGE && (
              <div className="flex items-center justify-between border-t px-5 py-3">
                <span className="text-xs text-muted-foreground">
                  Showing {Math.min((page - 1) * PER_PAGE + 1, total)}–{Math.min(page * PER_PAGE, total)} of {total}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page === 1 || searching}
                    onClick={() => doSearch(query, page - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    disabled={page * PER_PAGE >= total || searching}
                    onClick={() => doSearch(query, page + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border text-muted-foreground transition-colors hover:bg-muted disabled:opacity-30"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
