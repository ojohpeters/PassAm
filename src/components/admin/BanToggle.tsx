"use client"

import { useState, useTransition } from "react"
import { banStudent, unbanStudent } from "@/actions/admin.actions"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Loader2, ShieldBan, ShieldCheck } from "lucide-react"

export function BanToggle({ userId, isBanned }: { userId: string; isBanned: boolean }) {
  const [banned, setBanned] = useState(isBanned)
  const [isPending, startTransition] = useTransition()

  function toggle() {
    startTransition(async () => {
      const result = banned
        ? await unbanStudent(userId)
        : await banStudent(userId)

      if (result.success) {
        setBanned(!banned)
        toast.success(banned ? "Student unbanned" : "Student banned")
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
        banned
          ? "bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:hover:bg-rose-900/50"
          : "bg-muted text-muted-foreground hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-950/50 dark:hover:text-red-400"
      )}
    >
      {isPending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : banned ? (
        <ShieldBan className="h-3 w-3" />
      ) : (
        <ShieldCheck className="h-3 w-3" />
      )}
      {banned ? "Banned" : "Active"}
    </button>
  )
}
