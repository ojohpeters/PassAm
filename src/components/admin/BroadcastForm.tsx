"use client"

import { useState, useTransition } from "react"
import { broadcastNotification } from "@/actions/admin.actions"
import { toast } from "sonner"
import { Loader2, Send } from "lucide-react"

export function BroadcastForm() {
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [sent, setSent] = useState<number | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSend() {
    if (!title.trim() || !body.trim()) {
      toast.error("Title and message are required")
      return
    }
    startTransition(async () => {
      const result = await broadcastNotification(title.trim(), body.trim())
      if (result.success) {
        setSent(result.data.count)
        setTitle("")
        setBody("")
        toast.success(`Sent to ${result.data.count} students!`)
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Title
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={80}
          placeholder="e.g. New UNILAG questions added!"
          className="w-full rounded-xl border bg-background px-4 py-3 text-sm text-foreground outline-none ring-primary/40 transition-all focus:border-primary focus:ring-2"
        />
      </div>

      <div className="space-y-1.5">
        <label className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <span>Message</span>
          <span className={body.length > 250 ? "text-rose-500" : ""}>{body.length}/300</span>
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, 300))}
          rows={4}
          placeholder="What do you want to tell all students?"
          className="w-full resize-none rounded-xl border bg-background px-4 py-3 text-sm text-foreground outline-none ring-primary/40 transition-all focus:border-primary focus:ring-2"
        />
      </div>

      {/* Preview */}
      {(title || body) && (
        <div className="rounded-xl border-l-4 border-primary bg-primary/5 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">Preview</p>
          <p className="mt-1.5 font-semibold">{title || "Untitled"}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{body || "No message yet"}</p>
        </div>
      )}

      <button
        onClick={handleSend}
        disabled={isPending || !title.trim() || !body.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
      >
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {isPending ? "Sending…" : "Send to All Students"}
      </button>

      {sent !== null && (
        <div className="rounded-xl bg-emerald-50 p-4 text-center dark:bg-emerald-950/40">
          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
            ✅ Message delivered to {sent} students
          </p>
        </div>
      )}
    </div>
  )
}
