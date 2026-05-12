"use client"

import { useEffect } from "react"

export function ChunkErrorHandler() {
  useEffect(() => {
    const RELOAD_KEY = "__prepiq_chunk_reload"

    const handleError = (event: ErrorEvent) => {
      const target = event.target
      if (
        target instanceof HTMLScriptElement &&
        target.src.includes("/_next/static/")
      ) {
        if (!sessionStorage.getItem(RELOAD_KEY)) {
          sessionStorage.setItem(RELOAD_KEY, "1")
          window.location.reload()
        }
      }
    }

    // Resource errors (script 404) don't bubble — must use capture phase
    window.addEventListener("error", handleError, true)
    return () => window.removeEventListener("error", handleError, true)
  }, [])

  return null
}
