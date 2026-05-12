"use client"

import { useState } from "react"
import { markOneRead } from "@/actions/notification.actions"
import { Bell, X } from "lucide-react"

type Notif = { id: string; title: string; body: string }

export function NotificationBanner({ notifications }: { notifications: Notif[] }) {
  const [visible, setVisible] = useState<Notif[]>(notifications)

  async function dismiss(id: string) {
    setVisible((prev) => prev.filter((n) => n.id !== id))
    await markOneRead(id)
  }

  if (visible.length === 0) return null

  return (
    <div className="space-y-2">
      {visible.map((n) => (
        <div
          key={n.id}
          className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3"
        >
          <Bell className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-primary">{n.title}</p>
            <p className="text-xs text-muted-foreground">{n.body}</p>
          </div>
          <button
            onClick={() => dismiss(n.id)}
            className="shrink-0 rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
