"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { X, School, ChevronRight, PlusCircle } from "lucide-react"

const STORAGE_KEY = "prepiq:school-prompt-dismissed"
const SHOW_AGAIN_AFTER_MS = 3 * 24 * 60 * 60 * 1000 // 3 days

export function SchoolPrompt() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Delay mount so it doesn't flash on first render
    const timer = setTimeout(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) { setVisible(true); return }
        const lastDismissed = parseInt(raw, 10)
        if (Date.now() - lastDismissed > SHOW_AGAIN_AFTER_MS) setVisible(true)
      } catch {
        setVisible(true)
      }
    }, 2500)
    return () => clearTimeout(timer)
  }, [])

  function dismiss() {
    try { localStorage.setItem(STORAGE_KEY, Date.now().toString()) } catch { /* noop */ }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:inset-0 md:flex md:items-center md:justify-center animate-in slide-in-from-bottom-4 duration-300">
        <div className="mx-auto w-full max-w-md rounded-t-3xl md:rounded-3xl bg-background border shadow-2xl overflow-hidden">

          {/* Top accent strip */}
          <div className="h-1 w-full bg-gradient-to-r from-primary via-indigo-500 to-violet-500" />

          <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-2xl">
                  🏫
                </div>
                <div>
                  <p className="font-black text-base leading-tight">Set your target school</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Unlock personalised readiness scores &amp; exam practice
                  </p>
                </div>
              </div>
              <button
                onClick={dismiss}
                className="shrink-0 rounded-xl p-1.5 text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Why it matters */}
            <div className="rounded-2xl border bg-muted/30 p-4 space-y-2">
              {[
                "Track your % readiness for your school's exam",
                "Get subject-by-subject accuracy breakdown",
                "Practice past questions from the right school",
              ].map((txt) => (
                <div key={txt} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 text-emerald-500 shrink-0">✓</span>
                  <span>{txt}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="space-y-2">
              <Link
                href="/profile"
                onClick={dismiss}
                className="group flex items-center justify-between gap-3 w-full rounded-2xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <div className="flex items-center gap-2">
                  <School className="h-4 w-4" />
                  Choose my target school
                </div>
                <ChevronRight className="h-4 w-4 opacity-70 transition-transform group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/request-school"
                onClick={dismiss}
                className="group flex items-center justify-between gap-3 w-full rounded-2xl border px-4 py-3.5 text-sm font-semibold hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-2 text-muted-foreground">
                  <PlusCircle className="h-4 w-4" />
                  My school isn&apos;t listed — request it
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-60 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <button
              onClick={dismiss}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              Remind me later
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
