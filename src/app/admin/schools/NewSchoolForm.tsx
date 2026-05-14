"use client"

import { useState, useTransition } from "react"
import { createSchool } from "@/actions/admin.actions"
import { useRouter } from "next/navigation"
import { Plus, Loader2, CheckCircle2, XCircle } from "lucide-react"

export function NewSchoolForm() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(true)
  const [name, setName] = useState("")
  const [abbreviation, setAbbreviation] = useState("")
  const [location, setLocation] = useState("")
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    startTransition(async () => {
      const res = await createSchool(name, abbreviation, location || undefined)
      if (!res.success) {
        setMsg({ ok: false, text: res.error })
        return
      }
      setMsg({ ok: true, text: `${name} (${abbreviation.toUpperCase()}) added!` })
      setName("")
      setAbbreviation("")
      setLocation("")
      router.refresh()
    })
  }

  return (
    <div className="rounded-2xl border bg-background overflow-hidden">
      <button
        onClick={() => { setOpen((v) => !v); setMsg(null) }}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-muted/50"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Plus className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold">Add New School</p>
            <p className="text-xs text-muted-foreground">Create a school before uploading its questions</p>
          </div>
        </div>
        <span className="text-xs font-semibold text-primary">{open ? "Cancel" : "New"}</span>
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="border-t px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">School Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Air Force Institute of Technology"
                required
                className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="col-span-2 space-y-1.5 sm:col-span-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Abbreviation</label>
              <input
                value={abbreviation}
                onChange={(e) => setAbbreviation(e.target.value.toUpperCase())}
                placeholder="e.g. AFIT"
                maxLength={10}
                required
                className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div className="col-span-2 space-y-1.5 sm:col-span-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Location <span className="normal-case font-normal text-muted-foreground/70">(optional)</span>
              </label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Kaduna, Kaduna State"
                className="w-full rounded-xl border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {msg && (
            <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium ${
              msg.ok
                ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                : "bg-destructive/10 text-destructive"
            }`}>
              {msg.ok ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}
              {msg.text}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending || !name.trim() || !abbreviation.trim()}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 disabled:opacity-40"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {isPending ? "Adding…" : "Add School"}
          </button>
        </form>
      )}
    </div>
  )
}
