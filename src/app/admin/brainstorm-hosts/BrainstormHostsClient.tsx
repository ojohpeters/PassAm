"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Loader2, Search, Trash2, UserPlus, Radio, ToggleLeft, ToggleRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { BrainstormHostRow } from "@/actions/brainstorm.actions"
import {
  addBrainstormHost,
  removeBrainstormHost,
  toggleBrainstormHost,
  searchStudents,
} from "@/actions/brainstorm.actions"

function Avatar({ name, url }: { name: string; url: string | null }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-xs font-black text-white">
      {url ? <img src={url} alt={name} className="h-full w-full object-cover" /> : name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()}
    </div>
  )
}

export function BrainstormHostsClient({ initialHosts }: { initialHosts: BrainstormHostRow[] }) {
  const [hosts, setHosts] = useState(initialHosts)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<{ id: string; name: string; avatar_url: string | null }[]>([])
  const [searching, setSearching] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleSearch(q: string) {
    setQuery(q)
    if (q.trim().length < 2) { setResults([]); return }
    setSearching(true)
    const { students } = await searchStudents(q, 1, 8)
    setResults(students.filter(s => !hosts.some(h => h.user_id === s.id)))
    setSearching(false)
  }

  function handleAdd(student: { id: string; name: string; avatar_url: string | null }) {
    startTransition(async () => {
      const res = await addBrainstormHost(student.id)
      if (!res.success) { toast.error("Failed to add host"); return }
      toast.success(`${student.name} is now a brainstorm host`)
      setResults([])
      setQuery("")
      // Optimistically add
      setHosts(prev => [
        {
          id: "pending",
          user_id: student.id,
          is_active: true,
          created_at: new Date().toISOString(),
          user: { name: student.name, email: null, avatar_url: student.avatar_url },
        },
        ...prev,
      ])
    })
  }

  function handleToggle(host: BrainstormHostRow) {
    startTransition(async () => {
      const res = await toggleBrainstormHost(host.id, !host.is_active)
      if (!res.success) { toast.error("Failed to update"); return }
      setHosts(prev => prev.map(h => h.id === host.id ? { ...h, is_active: !h.is_active } : h))
    })
  }

  function handleRemove(host: BrainstormHostRow) {
    startTransition(async () => {
      const res = await removeBrainstormHost(host.id)
      if (!res.success) { toast.error("Failed to remove"); return }
      setHosts(prev => prev.filter(h => h.id !== host.id))
      toast.success("Host removed")
    })
  }

  return (
    <div className="space-y-5">
      {/* Search + add */}
      <div className="rounded-2xl border bg-background p-5 space-y-3">
        <p className="text-sm font-bold">Add a host</p>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search students by name…"
            className="w-full rounded-xl border bg-muted/30 py-2.5 pl-9 pr-4 text-sm outline-none ring-primary/40 focus:border-primary focus:ring-2"
          />
          {searching && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
        </div>
        {results.length > 0 && (
          <div className="space-y-1.5 rounded-xl border bg-background p-2 shadow-lg">
            {results.map((s) => (
              <button
                key={s.id}
                onClick={() => handleAdd(s)}
                disabled={isPending}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-muted transition-colors"
              >
                <Avatar name={s.name} url={s.avatar_url} />
                <span className="flex-1 text-sm font-semibold">{s.name}</span>
                <UserPlus className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Host list */}
      {hosts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-muted/20 py-12 text-center">
          <Radio className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-semibold text-muted-foreground">No brainstorm hosts yet</p>
          <p className="text-xs text-muted-foreground">Search for a student above to grant hosting access.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {hosts.map((host) => (
            <div
              key={host.id}
              className={cn(
                "flex items-center gap-3 rounded-2xl border p-4 transition-colors",
                host.is_active ? "bg-background" : "bg-muted/30 opacity-70"
              )}
            >
              <Avatar name={host.user?.name ?? "?"} url={host.user?.avatar_url ?? null} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{host.user?.name ?? "Unknown"}</p>
                <p className="text-xs text-muted-foreground truncate">{host.user?.email ?? ""}</p>
              </div>
              <span className={cn(
                "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                host.is_active
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground"
              )}>
                {host.is_active ? "Active" : "Disabled"}
              </span>
              <button
                onClick={() => handleToggle(host)}
                disabled={isPending}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title={host.is_active ? "Disable host" : "Enable host"}
              >
                {host.is_active
                  ? <ToggleRight className="h-5 w-5 text-emerald-500" />
                  : <ToggleLeft className="h-5 w-5" />
                }
              </button>
              <button
                onClick={() => handleRemove(host)}
                disabled={isPending}
                className="text-muted-foreground hover:text-red-500 transition-colors"
                title="Remove host"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
