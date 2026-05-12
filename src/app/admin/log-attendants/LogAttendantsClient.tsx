"use client"

import { useState, useTransition, useCallback, useEffect, useRef } from "react"
import { addLogAttendant, removeLogAttendant, searchStudents } from "@/actions/brainstorm.actions"
import { ChevronLeft, ChevronRight, Loader2, Plus, Search, Trash2, UserPlus, X } from "lucide-react"
import { cn } from "@/lib/utils"

const PER_PAGE = 20

type Attendant = {
  id: string
  user_id: string
  created_at: string
  user: { name: string; email: string | null; avatar_url: string | null } | null
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-black text-white shadow-sm">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} className="h-full w-full object-cover" />
      ) : (
        initials(name)
      )}
    </div>
  )
}

export function LogAttendantsClient({
  initialAttendants,
}: {
  initialAttendants: Attendant[]
}) {
  const [attendants, setAttendants] = useState(initialAttendants)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [, startMutation] = useTransition()

  // Add modal
  const [addOpen, setAddOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Array<{
    id: string; name: string; avatar_url: string | null; target_school: string | null
  }>>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [searching, setSearching] = useState(false)
  const [grantingId, setGrantingId] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const doSearch = useCallback(async (q: string, p: number) => {
    setSearching(true)
    const res = await searchStudents(q, p, PER_PAGE)
    setResults(res.students as typeof results)
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

  async function handleGrant(userId: string, name: string, email: string | null, avatarUrl: string | null) {
    setGrantingId(userId)
    const res = await addLogAttendant(userId)
    setGrantingId(null)
    if (res.success) {
      setAttendants((prev) => [
        {
          id: `tmp-${userId}`,
          user_id: userId,
          created_at: new Date().toISOString(),
          user: { name, email, avatar_url: avatarUrl },
        },
        ...prev,
      ])
    }
  }

  function handleRevoke(id: string) {
    setRemovingId(id)
    startMutation(async () => {
      await removeLogAttendant(id)
      setAttendants((prev) => prev.filter((a) => a.id !== id))
      setRemovingId(null)
    })
  }

  const attendantUserIds = new Set(attendants.map((a) => a.user_id))

  return (
    <div className="space-y-5">
      {/* Add attendant button */}
      <button
        onClick={() => setAddOpen(true)}
        className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
      >
        <UserPlus className="h-4 w-4" />
        Grant Access
      </button>

      {/* Current attendants */}
      {attendants.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-14 text-center">
          <span className="text-3xl">📋</span>
          <h3 className="mt-3 font-bold">No log attendants yet</h3>
          <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
            Grant access to students who will log brainstorm session attendance.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-background divide-y">
          {attendants.map((a) => (
            <div key={a.id} className="flex items-center gap-3 px-4 py-3">
              <Avatar name={a.user?.name ?? "?"} url={a.user?.avatar_url ?? null} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{a.user?.name ?? "Unknown"}</p>
                {a.user?.email && (
                  <p className="text-[11px] text-muted-foreground truncate">{a.user.email}</p>
                )}
              </div>
              <span className="hidden text-[11px] text-muted-foreground sm:block">
                {new Date(a.created_at).toLocaleDateString()}
              </span>
              <button
                disabled={removingId === a.id}
                onClick={() => handleRevoke(a.id)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40 dark:hover:bg-rose-950/30"
              >
                {removingId === a.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {addOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setAddOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 flex max-h-[78vh] flex-col rounded-t-3xl border-t bg-background shadow-2xl md:inset-0 md:m-auto md:h-auto md:max-h-[80vh] md:max-w-md md:rounded-2xl md:border">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h3 className="font-black">Grant Log Access</h3>
                <p className="text-xs text-muted-foreground">Choose a student to become a log attendant</p>
              </div>
              <button
                onClick={() => setAddOpen(false)}
                className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="border-b px-4 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search students by name…"
                  className="w-full rounded-xl border bg-muted/30 py-2.5 pl-9 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {searching ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-primary/40" />
                </div>
              ) : results.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <Search className="mb-2 h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm font-semibold text-muted-foreground">No students found</p>
                </div>
              ) : (
                <div className="divide-y">
                  {results.map((s) => {
                    const isAttendant = attendantUserIds.has(s.id)
                    return (
                      <div key={s.id} className="flex items-center gap-3 px-5 py-3">
                        <Avatar name={s.name} url={s.avatar_url} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold">{s.name}</p>
                          {s.target_school && (
                            <p className="text-[11px] text-muted-foreground">{s.target_school}</p>
                          )}
                        </div>
                        {isAttendant ? (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                            Attendant ✓
                          </span>
                        ) : (
                          <button
                            disabled={grantingId === s.id}
                            onClick={() => handleGrant(s.id, s.name, null, s.avatar_url)}
                            className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-60 active:scale-[0.97]"
                          >
                            {grantingId === s.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Plus className="h-3 w-3" />
                            )}
                            Grant
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {total > PER_PAGE && (
              <div className="flex items-center justify-between border-t px-5 py-3">
                <span className="text-xs text-muted-foreground">
                  {Math.min((page - 1) * PER_PAGE + 1, total)}–{Math.min(page * PER_PAGE, total)} of {total}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1 || searching}
                    onClick={() => doSearch(query, page - 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border transition-colors hover:bg-muted disabled:opacity-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    disabled={page * PER_PAGE >= total || searching}
                    onClick={() => doSearch(query, page + 1)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl border transition-colors hover:bg-muted disabled:opacity-30"
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
