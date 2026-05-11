"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"

export function NavigationProgress() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [width, setWidth] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const prevPathname = useRef(pathname)

  function start() {
    if (intervalRef.current) return
    setVisible(true)
    setWidth(5)
    intervalRef.current = setInterval(() => {
      setWidth((w) => {
        if (w >= 80) {
          clearInterval(intervalRef.current!)
          intervalRef.current = null
          return 80
        }
        return w + Math.random() * 12
      })
    }, 250)
  }

  function finish() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setWidth(100)
    timeoutRef.current = setTimeout(() => {
      setVisible(false)
      setWidth(0)
    }, 350)
  }

  // Intercept internal link clicks → start the bar
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as Element).closest("a[href]") as HTMLAnchorElement | null
      if (!anchor) return
      const href = anchor.getAttribute("href") ?? ""
      if (!href || href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto")) return
      if (href === pathname) return
      start()
    }

    document.addEventListener("click", handleClick, true)
    return () => document.removeEventListener("click", handleClick, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Pathname changed → navigation complete, finish the bar
  useEffect(() => {
    if (pathname !== prevPathname.current) {
      prevPathname.current = pathname
      finish()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Cleanup on unmount
  useEffect(() => () => {
    clearInterval(intervalRef.current ?? undefined)
    clearTimeout(timeoutRef.current ?? undefined)
  }, [])

  if (!visible) return null

  return (
    <div
      aria-hidden="true"
      className="fixed left-0 top-0 z-[9999] h-[3px] rounded-r-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)] transition-[width] duration-200 ease-out"
      style={{ width: `${width}%` }}
    />
  )
}
