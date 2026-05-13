"use client"

import { useState } from "react"
import { Calculator as CalcIcon, X } from "lucide-react"
import { cn } from "@/lib/utils"

function compute(a: number, op: string, b: number): number {
  if (op === "+") return a + b
  if (op === "-") return a - b
  if (op === "*") return a * b
  if (op === "/") return b === 0 ? Infinity : a / b
  return b
}

function fmt(n: number): string {
  if (!isFinite(n) || isNaN(n)) return "Error"
  if (Number.isInteger(n)) return String(n)
  const s = parseFloat(n.toPrecision(10)).toString()
  return s.length > 14 ? n.toExponential(4) : s
}

export function Calculator() {
  const [open, setOpen] = useState(false)
  const [display, setDisplay] = useState("0")
  const [prev, setPrev] = useState<number | null>(null)
  const [op, setOp] = useState<string | null>(null)
  const [fresh, setFresh] = useState(false)

  function digit(d: string) {
    if (fresh) {
      setFresh(false)
      setDisplay(d === "." ? "0." : d === "0" ? "0" : d)
      return
    }
    setDisplay((cur) => {
      if (cur === "Error") return d === "." ? "0." : d
      if (d === "." && cur.includes(".")) return cur
      if (cur.length >= 13) return cur
      if (cur === "0" && d !== ".") return d
      return cur + d
    })
  }

  function operator(o: string) {
    if (display === "Error") { clear(); return }
    const cur = parseFloat(display)
    if (isNaN(cur)) { clear(); return }

    if (op !== null && !fresh) {
      const r = compute(prev!, op, cur)
      const s = fmt(r)
      setDisplay(s)
      setPrev(s === "Error" ? null : r)
    } else if (prev === null) {
      setPrev(cur)
    }
    setOp(o)
    setFresh(true)
  }

  function equals() {
    if (op === null || prev === null) return
    const cur = parseFloat(display)
    if (isNaN(cur)) return
    const r = compute(prev, op, cur)
    setDisplay(fmt(r))
    setPrev(null)
    setOp(null)
    setFresh(true)
  }

  function clear() {
    setDisplay("0")
    setPrev(null)
    setOp(null)
    setFresh(false)
  }

  function backspace() {
    if (fresh) return
    setDisplay((cur) => {
      if (cur === "Error" || cur.length <= 1) return "0"
      return cur.slice(0, -1) || "0"
    })
  }

  const numBtn = "flex items-center justify-center rounded-xl text-sm font-bold h-11 bg-muted/60 hover:bg-muted active:scale-95 transition-all select-none"
  const opBtn  = "flex items-center justify-center rounded-xl text-sm font-bold h-11 bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25 active:scale-95 transition-all select-none"

  return (
    <>
      {/* ── Floating trigger ── */}
      <div className="fixed bottom-20 right-4 z-40 md:bottom-8 md:right-6">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Open calculator"
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full border bg-background shadow-lg transition-all hover:shadow-xl active:scale-95",
            open && "bg-primary text-primary-foreground border-primary"
          )}
        >
          <CalcIcon className="h-5 w-5" />
        </button>
      </div>

      {/* ── Panel ── */}
      {open && (
        <>
          {/* Mobile tap-away backdrop */}
          <div
            className="fixed inset-0 z-40 md:hidden"
            onClick={() => setOpen(false)}
          />

          <div className="fixed bottom-36 left-4 right-4 z-50 rounded-3xl border bg-background shadow-2xl md:bottom-24 md:left-auto md:right-6 md:w-[256px]">
            <div className="p-3 space-y-2">

              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Calculator
                </span>
                <button
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Display */}
              <div className="rounded-2xl bg-muted/40 px-4 py-3 text-right min-h-[4rem] flex flex-col justify-end">
                {(prev !== null || op) && (
                  <p className="text-[11px] text-muted-foreground tabular-nums font-mono truncate">
                    {prev !== null ? fmt(prev) : ""} {op ?? ""}
                  </p>
                )}
                <p className={cn(
                  "font-mono font-black tabular-nums leading-none",
                  display.length > 10 ? "text-xl" : display.length > 7 ? "text-2xl" : "text-3xl"
                )}>
                  {display}
                </p>
              </div>

              {/* Button grid */}
              <div className="grid grid-cols-4 gap-1.5">

                {/* Row 1 */}
                <button onClick={clear}
                  className="flex items-center justify-center rounded-xl text-sm font-black h-11 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 active:scale-95 transition-all select-none col-span-2">
                  C
                </button>
                <button onClick={backspace}
                  className="flex items-center justify-center rounded-xl text-sm font-bold h-11 bg-muted/60 hover:bg-muted active:scale-95 transition-all select-none text-muted-foreground">
                  ⌫
                </button>
                <button onClick={() => operator("/")} className={opBtn}>÷</button>

                {/* Row 2 */}
                <button onClick={() => digit("7")} className={numBtn}>7</button>
                <button onClick={() => digit("8")} className={numBtn}>8</button>
                <button onClick={() => digit("9")} className={numBtn}>9</button>
                <button onClick={() => operator("*")} className={opBtn}>×</button>

                {/* Row 3 */}
                <button onClick={() => digit("4")} className={numBtn}>4</button>
                <button onClick={() => digit("5")} className={numBtn}>5</button>
                <button onClick={() => digit("6")} className={numBtn}>6</button>
                <button onClick={() => operator("-")} className={opBtn}>−</button>

                {/* Row 4 */}
                <button onClick={() => digit("1")} className={numBtn}>1</button>
                <button onClick={() => digit("2")} className={numBtn}>2</button>
                <button onClick={() => digit("3")} className={numBtn}>3</button>
                {/* = spans rows 4–5 */}
                <button onClick={equals}
                  className="flex items-center justify-center rounded-xl text-sm font-black bg-primary text-primary-foreground hover:opacity-90 active:scale-95 transition-all select-none row-span-2">
                  =
                </button>

                {/* Row 5 */}
                <button onClick={() => digit("0")} className={cn(numBtn, "col-span-2")}>0</button>
                <button onClick={() => digit(".")} className={numBtn}>.</button>
                {/* col 4 row 5 is occupied by = above */}

              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
