"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Play, Pause, RotateCcw, SkipForward } from "lucide-react"

type Phase = "work" | "shortBreak" | "longBreak"

const PHASES: Record<Phase, { label: string; mins: number }> = {
  work:       { label: "Focus",       mins: 25 },
  shortBreak: { label: "Short Break", mins: 5  },
  longBreak:  { label: "Long Break",  mins: 15 },
}

const RING_COLORS: Record<Phase, string> = {
  work:       "hsl(var(--primary))",
  shortBreak: "#10b981",
  longBreak:  "#3b82f6",
}

const BTN_COLORS: Record<Phase, string> = {
  work:       "bg-primary shadow-primary/30",
  shortBreak: "bg-emerald-500 shadow-emerald-500/30",
  longBreak:  "bg-blue-500 shadow-blue-500/30",
}

function playBeep() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
    osc.start()
    osc.stop(ctx.currentTime + 0.8)
  } catch { /* AudioContext unavailable */ }
}

export function PomodoroTimer({ onFocusComplete }: { onFocusComplete?: (secs: number) => void } = {}) {
  const [phase, setPhase]       = useState<Phase>("work")
  const [timeLeft, setTimeLeft] = useState(PHASES.work.mins * 60)
  const [running, setRunning]   = useState(false)
  const [sessions, setSessions] = useState(0)

  const phaseRef    = useRef<Phase>("work")
  const sessionsRef = useRef(0)
  phaseRef.current  = phase

  const totalTime = PHASES[phase].mins * 60

  const advancePhase = useCallback((natural = false) => {
    playBeep()
    if (phaseRef.current === "work") {
      const n = sessionsRef.current + 1
      sessionsRef.current = n
      setSessions(n)
      if (natural) onFocusComplete?.(PHASES.work.mins * 60)
      const next: Phase = n % 4 === 0 ? "longBreak" : "shortBreak"
      setPhase(next)
      setTimeLeft(PHASES[next].mins * 60)
    } else {
      setPhase("work")
      setTimeLeft(PHASES.work.mins * 60)
    }
  }, [onFocusComplete])

  // Tick
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000)
    return () => clearInterval(id)
  }, [running])

  // Auto-advance when timer hits 0 (natural completion)
  useEffect(() => {
    if (timeLeft === 0 && running) {
      setRunning(false)
      advancePhase(true)
    }
  }, [timeLeft, running, advancePhase])

  function switchPhase(p: Phase) {
    setPhase(p)
    setTimeLeft(PHASES[p].mins * 60)
    setRunning(false)
  }

  function reset() {
    setTimeLeft(PHASES[phase].mins * 60)
    setRunning(false)
  }

  const mins = Math.floor(timeLeft / 60).toString().padStart(2, "0")
  const secs = (timeLeft % 60).toString().padStart(2, "0")

  const radius       = 54
  const circumference = 2 * Math.PI * radius
  const offset       = circumference * (1 - timeLeft / totalTime)

  const dotsFilled = sessions === 0 ? 0 : sessions % 4 === 0 ? 4 : sessions % 4

  return (
    <div className="rounded-2xl border bg-background p-6 space-y-5">
      <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Pomodoro Timer</h2>

      {/* Phase tabs */}
      <div className="flex gap-1 rounded-xl bg-muted/50 p-1">
        {(Object.entries(PHASES) as [Phase, { label: string; mins: number }][]).map(([key, { label }]) => (
          <button
            key={key}
            onClick={() => switchPhase(key)}
            className={cn(
              "flex-1 rounded-lg py-1.5 text-xs font-semibold transition-all",
              phase === key
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Ring + time */}
      <div className="flex flex-col items-center gap-5">
        <div className="relative">
          <svg viewBox="0 0 120 120" className="w-44 h-44" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="7" className="stroke-muted/40" />
            <circle
              cx="60" cy="60" r={radius} fill="none" strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              stroke={RING_COLORS[phase]}
              style={{ transition: running ? "stroke-dashoffset 1s linear" : "none" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-black tabular-nums tracking-tight">{mins}:{secs}</span>
            <span className="text-xs font-semibold text-muted-foreground mt-1">{PHASES[phase].label}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={reset}
            className="flex h-10 w-10 items-center justify-center rounded-xl border text-muted-foreground hover:bg-muted transition-colors active:scale-95"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            onClick={() => setRunning((r) => !r)}
            className={cn(
              "flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg transition-all active:scale-95 hover:opacity-90",
              BTN_COLORS[phase]
            )}
          >
            {running
              ? <Pause className="h-6 w-6" />
              : <Play className="h-6 w-6 translate-x-0.5" />
            }
          </button>

          <button
            onClick={() => { setRunning(false); advancePhase(false) }}
            className="flex h-10 w-10 items-center justify-center rounded-xl border text-muted-foreground hover:bg-muted transition-colors active:scale-95"
          >
            <SkipForward className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Session dots */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "h-2 w-2 rounded-full transition-colors duration-300",
                i < dotsFilled ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {sessions} session{sessions !== 1 ? "s" : ""} completed · long break every 4
        </p>
      </div>
    </div>
  )
}
