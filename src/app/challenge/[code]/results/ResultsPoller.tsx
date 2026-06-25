"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function ResultsPoller({ bothDone }: { bothDone: boolean }) {
  const router = useRouter()

  useEffect(() => {
    if (bothDone) return
    const t = setInterval(() => router.refresh(), 4000)
    return () => clearInterval(t)
  }, [bothDone, router])

  return null
}
