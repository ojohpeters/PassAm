"use client"

import { useState, useEffect, useRef } from "react"
import { StickyNote, Trash2 } from "lucide-react"

const KEY = "prepiq:scratchpad"

export function Scratchpad() {
  const [text, setText]       = useState("")
  const [saved, setSaved]     = useState(true)
  const [mounted, setMounted] = useState(false)
  const saveTimerRef          = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setText(localStorage.getItem(KEY) ?? "")
    setMounted(true)
  }, [])

  function handleChange(val: string) {
    setText(val)
    setSaved(false)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      localStorage.setItem(KEY, val)
      setSaved(true)
    }, 600)
  }

  function clear() {
    setText("")
    localStorage.removeItem(KEY)
    setSaved(true)
  }

  if (!mounted) return null

  return (
    <div className="rounded-2xl border bg-background p-6 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Notes</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {saved ? "Saved" : "Saving…"}
          </span>
          {text && (
            <button
              onClick={clear}
              className="text-muted-foreground hover:text-destructive transition-colors"
              title="Clear notes"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <textarea
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Jot down anything — formulas, key points, reminders…"
        rows={6}
        className="w-full resize-y rounded-xl border bg-muted/20 px-4 py-3 text-sm font-mono leading-relaxed outline-none ring-primary/40 placeholder:text-muted-foreground focus:border-primary focus:ring-2"
      />

      <div className="flex justify-end">
        <span className="text-xs tabular-nums text-muted-foreground">
          {text.length} chars
        </span>
      </div>
    </div>
  )
}
