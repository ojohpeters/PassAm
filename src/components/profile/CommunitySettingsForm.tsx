"use client"

import { useState, useTransition } from "react"
import { updateWhatsappSettings } from "@/actions/community.actions"
import { MessageCircle, Save, Loader2, Check } from "lucide-react"
import { cn } from "@/lib/utils"

export function CommunitySettingsForm({
  initialNumber,
  initialVisible,
}: {
  initialNumber: string | null
  initialVisible: boolean
}) {
  const [number, setNumber] = useState(initialNumber ?? "")
  const [visible, setVisible] = useState(initialVisible)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    if (visible && !number.trim()) {
      setError("Add a WhatsApp number first, or turn visibility off.")
      return
    }
    setError(null)
    startTransition(async () => {
      const res = await updateWhatsappSettings(number, visible)
      if (res.success) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      } else {
        setError("Failed to save. Please try again.")
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#25D366]/15">
          <MessageCircle className="h-4.5 w-4.5 text-[#128C7E]" />
        </div>
        <div>
          <p className="text-sm font-bold">Community Visibility</p>
          <p className="text-xs text-muted-foreground">
            Let other students see and message you on WhatsApp
          </p>
        </div>
      </div>

      {/* Number input */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground">WhatsApp Number</label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">+</span>
          <input
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="234XXXXXXXXXX"
            className="w-full rounded-xl border bg-background py-3 pl-7 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          Include country code, e.g. 2348012345678 (no +)
        </p>
      </div>

      {/* Visibility toggle */}
      <div className="flex items-center justify-between rounded-2xl border bg-muted/20 px-4 py-3">
        <div>
          <p className="text-sm font-bold">Show in Community</p>
          <p className="text-xs text-muted-foreground">
            {visible ? "Visible to all students" : "Hidden from the directory"}
          </p>
        </div>
        <button
          onClick={() => setVisible((v) => !v)}
          className={cn(
            "relative h-6 w-11 rounded-full transition-colors",
            visible ? "bg-[#25D366]" : "bg-muted"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all",
              visible ? "left-[22px]" : "left-0.5"
            )}
          />
        </button>
      </div>

      {error && (
        <p className="rounded-xl bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-600 dark:bg-rose-950/30 dark:text-rose-400">
          {error}
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={isPending || saved}
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-all",
          saved
            ? "bg-emerald-500"
            : "bg-[#128C7E] hover:bg-[#0f7068] active:scale-[0.98]",
          (isPending || saved) && "opacity-90"
        )}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : saved ? (
          <><Check className="h-4 w-4" /> Saved!</>
        ) : (
          <><Save className="h-4 w-4" /> Save Community Settings</>
        )}
      </button>
    </div>
  )
}
