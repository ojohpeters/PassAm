"use client"

import { useEffect } from "react"
import { toast } from "sonner"

export function OfflineNotifier() {
  useEffect(() => {
    const handleOffline = () => {
      toast.warning("You're offline", {
        id: "offline-status",
        description: "Exam answers save locally and sync when you reconnect.",
        duration: Infinity,
      })
    }
    const handleOnline = () => {
      toast.dismiss("offline-status")
      toast.success("Back online", { duration: 3000 })
    }
    window.addEventListener("offline", handleOffline)
    window.addEventListener("online", handleOnline)
    if (!navigator.onLine) handleOffline()
    return () => {
      window.removeEventListener("offline", handleOffline)
      window.removeEventListener("online", handleOnline)
    }
  }, [])

  return null
}
