"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Volume2, VolumeX } from "lucide-react"

const SOUNDS = {
  rain:  { label: "Rain",       emoji: "🌧️" },
  ocean: { label: "Ocean",      emoji: "🌊" },
  white: { label: "White",      emoji: "🤍" },
  cafe:  { label: "Café",       emoji: "☕" },
} as const

type SoundId = keyof typeof SOUNDS

function generateNoise(ctx: AudioContext, type: SoundId): AudioBufferSourceNode {
  const rate = ctx.sampleRate
  const size = rate * 4
  const buf  = ctx.createBuffer(1, size, rate)
  const data = buf.getChannelData(0)

  if (type === "rain" || type === "ocean") {
    // Brown noise — warmer, low rumble
    let last = 0
    for (let i = 0; i < size; i++) {
      const w = Math.random() * 2 - 1
      data[i] = (last + 0.02 * w) / 1.02
      last = data[i]
      data[i] *= 3.5
    }
  } else {
    // White noise base
    for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1
  }

  const src = ctx.createBufferSource()
  src.buffer = buf
  src.loop   = true
  return src
}

function applyFilter(ctx: AudioContext, src: AudioBufferSourceNode, type: SoundId): AudioNode {
  const filter = ctx.createBiquadFilter()
  if (type === "rain") {
    filter.type = "lowpass"
    filter.frequency.value = 900
    filter.Q.value = 0.6
  } else if (type === "ocean") {
    filter.type = "lowpass"
    filter.frequency.value = 280
    filter.Q.value = 0.4
  } else if (type === "cafe") {
    filter.type = "bandpass"
    filter.frequency.value = 1100
    filter.Q.value = 0.9
  } else {
    // white — slight lowpass to remove harsh highs
    filter.type = "lowpass"
    filter.frequency.value = 6000
  }
  src.connect(filter)
  return filter
}

export function AmbientPlayer() {
  const [active, setActive]   = useState<SoundId | null>(null)
  const [volume, setVolume]   = useState(0.4)

  const ctxRef    = useRef<AudioContext | null>(null)
  const gainRef   = useRef<GainNode | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)

  // Sync gain when volume slider changes
  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = volume
  }, [volume])

  // Cleanup on unmount
  useEffect(() => () => { try { ctxRef.current?.close() } catch {} }, [])

  function getCtx() {
    if (!ctxRef.current) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      gainRef.current = ctxRef.current.createGain()
      gainRef.current.gain.value = volume
      gainRef.current.connect(ctxRef.current.destination)
    }
    return ctxRef.current
  }

  function stopCurrent() {
    if (sourceRef.current) {
      try { sourceRef.current.stop() } catch {}
      sourceRef.current = null
    }
  }

  function toggle(id: SoundId) {
    if (active === id) {
      stopCurrent()
      setActive(null)
      return
    }
    const ctx = getCtx()
    stopCurrent()
    const src    = generateNoise(ctx, id)
    const output = applyFilter(ctx, src, id)
    output.connect(gainRef.current!)
    src.start()
    sourceRef.current = src
    setActive(id)
  }

  return (
    <div className="rounded-2xl border bg-background p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Ambient Sounds</h2>
        {active && (
          <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Playing
          </span>
        )}
      </div>

      {/* Sound buttons */}
      <div className="grid grid-cols-4 gap-2">
        {(Object.entries(SOUNDS) as [SoundId, { label: string; emoji: string }][]).map(([id, { label, emoji }]) => (
          <button
            key={id}
            onClick={() => toggle(id)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-xl border py-3 text-xs font-semibold transition-all active:scale-95",
              active === id
                ? "border-primary bg-primary/10 text-primary shadow-sm shadow-primary/20"
                : "text-muted-foreground hover:border-primary/30 hover:bg-muted/50"
            )}
          >
            <span className="text-xl">{emoji}</span>
            {label}
          </button>
        ))}
      </div>

      {/* Volume */}
      <div className="flex items-center gap-3">
        {volume === 0
          ? <VolumeX className="h-4 w-4 shrink-0 text-muted-foreground" />
          : <Volume2 className="h-4 w-4 shrink-0 text-muted-foreground" />
        }
        <input
          type="range" min={0} max={1} step={0.01}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="flex-1 accent-primary"
        />
        <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">
          {Math.round(volume * 100)}%
        </span>
      </div>
    </div>
  )
}
