"use client"

import { useState, useTransition } from "react"
import { updateWhatsappSettings } from "@/actions/community.actions"
import { MessageCircle, Save, Loader2, Check } from "lucide-react"
import { cn } from "@/lib/utils"

// Convert stored international format (2348012345678) → local display (08012345678)
function toLocal(stored: string | null): string {
  if (!stored) return ""
  if (stored.startsWith("234")) return "0" + stored.slice(3)
  return stored
}

// Convert local input (08012345678) → international (2348012345678)
function toInternational(local: string): string {
  const digits = local.replace(/\D/g, "")
  if (digits.startsWith("0")) return "234" + digits.slice(1)
  if (digits.startsWith("234")) return digits
  return "234" + digits
}

function isValidNigerianNumber(local: string): boolean {
  const digits = local.replace(/\D/g, "")
  return /^0[789]\d{9}$/.test(digits)
}

export function CommunitySettingsForm({
  initialNumber,
  initialVisible,
}: {
  initialNumber: string | null
  initialVisible: boolean
}) {
  const [number, setNumber] = useState(toLocal(initialNumber))
  const [visible, setVisible] = useState(initialVisible)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleNumberChange(val: string) {
    // Only allow digits and leading 0
    const cleaned = val.replace(/[^\d]/g, "")
    setNumber(cleaned)
    setError(null)
  }

  function handleSave() {
    if (visible) {
      if (!number.trim()) {
        setError("Add a WhatsApp number first, or turn visibility off.")
        return
      }
      if (!isValidNigerianNumber(number)) {
        setError("Enter a valid Nigerian number, e.g. 08012345678")
        return
      }
    }
    setError(null)
    const toStore = number.trim() ? toInternational(number) : ""
    startTransition(async () => {
      const res = await updateWhatsappSettings(toStore, visible)
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
        <div className="flex items-center rounded-xl border bg-background transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <span className="select-none pl-3.5 pr-1 text-sm font-bold text-muted-foreground">+234</span>
          <input
            value={number.startsWith("0") ? number.slice(1) : number}
            onChange={(e) => handleNumberChange("0" + e.target.value.replace(/\D/g, ""))}
            placeholder="8012345678"
            maxLength={10}
            inputMode="numeric"
            className="flex-1 rounded-xl bg-transparent py-3 pl-0 pr-4 text-sm outline-none"
          />
        </div>
        <p className="text-[11px] text-muted-foreground">
          Enter your number without the leading 0 — e.g. for 08012345678 type 8012345678
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
