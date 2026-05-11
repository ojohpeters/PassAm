"use client"

import { useState } from "react"
import { toast } from "sonner"

export function CsvUploadForm() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ created: number; failed: number } | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    const fd = new FormData(e.currentTarget)
    const res = await fetch("/api/admin/import", { method: "POST", body: fd })
    const json = await res.json()

    if (!res.ok || !json.success) {
      toast.error("Import failed.")
    } else {
      setResult(json.data)
      toast.success(`Imported ${json.data.created} questions (${json.data.failed} failed).`)
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border p-6">
      <div className="space-y-1">
        <label className="text-sm font-medium">CSV file</label>
        <input
          name="file"
          type="file"
          accept=".csv"
          required
          className="w-full rounded-md border px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1 file:text-xs file:font-semibold file:text-primary-foreground"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        {loading ? "Uploading…" : "Upload CSV"}
      </button>

      {result && (
        <p className="text-sm">
          ✅ {result.created} created &nbsp;·&nbsp;{" "}
          {result.failed > 0 && <span className="text-red-500">❌ {result.failed} failed</span>}
        </p>
      )}
    </form>
  )
}
