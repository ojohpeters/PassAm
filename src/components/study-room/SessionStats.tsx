"use client"

import { Clock, Zap, CheckCircle2 } from "lucide-react"

function formatFocus(secs: number) {
  const m = Math.floor(secs / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`
}

export function SessionStats({
  focusSecs,
  sessions,
  tasksDone,
}: {
  focusSecs: number
  sessions: number
  tasksDone: number
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="flex flex-col items-center gap-1.5 rounded-2xl border bg-background p-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
          <Clock className="h-4 w-4 text-primary" />
        </div>
        <p className="text-xl font-black tabular-nums">{formatFocus(focusSecs)}</p>
        <p className="text-[11px] text-muted-foreground text-center leading-tight">Focus time</p>
      </div>

      <div className="flex flex-col items-center gap-1.5 rounded-2xl border bg-background p-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-950/40">
          <Zap className="h-4 w-4 text-orange-500" />
        </div>
        <p className="text-xl font-black tabular-nums">{sessions}</p>
        <p className="text-[11px] text-muted-foreground text-center leading-tight">Sessions</p>
      </div>

      <div className="flex flex-col items-center gap-1.5 rounded-2xl border bg-background p-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-950/40">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        </div>
        <p className="text-xl font-black tabular-nums">{tasksDone}</p>
        <p className="text-[11px] text-muted-foreground text-center leading-tight">Tasks done</p>
      </div>
    </div>
  )
}
