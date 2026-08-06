"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Flag, ChevronLeft, ChevronRight, BookOpen, ChevronDown, ChevronUp } from "lucide-react"
import type { QuestionWithOptions, Passage } from "@/types"
import { RichText, renderMarkup, normalizeText } from "@/lib/question-format"

function PassagePanel({ passage }: { passage: Passage }) {
  const [expanded, setExpanded] = useState(true)
  const isLong = passage.text.length > 600

  return (
    <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/60 dark:border-blue-800/60 dark:bg-blue-950/20 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-blue-200/60 dark:border-blue-800/40 bg-blue-100/50 dark:bg-blue-900/20 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-300">
            {passage.title ?? "Read the passage below"}
          </span>
        </div>
        {isLong && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
          >
            {expanded ? <><ChevronUp className="h-3.5 w-3.5" /> Collapse</> : <><ChevronDown className="h-3.5 w-3.5" /> Expand</>}
          </button>
        )}
      </div>

      {/* Body */}
      <div className={cn(
        "px-4 py-3 overflow-hidden transition-all duration-300",
        !expanded && "max-h-24"
      )}>
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-serif">
          {passage.text}
        </p>
      </div>

      {/* Fade + expand hint when collapsed */}
      {isLong && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="flex w-full items-center justify-center gap-1 border-t border-blue-200/60 dark:border-blue-800/40 bg-gradient-to-t from-blue-50 dark:from-blue-950/20 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800"
        >
          <ChevronDown className="h-3.5 w-3.5" /> Read full passage
        </button>
      )}
    </div>
  )
}

// Detect and split Roman numeral list items embedded in question text.
// e.g. "...organs: I. Liver II. Kidney III. Stomach Which..." →
//   intro: "...organs:"
//   items: ["I. Liver", "II. Kidney", "III. Stomach Which..."]
function parseRomanList(text: string): { intro: string; items: string[] } | null {
  // Match a space followed by a Roman numeral (I-XVIII range covers exam usage) then ". "
  const re = /\s+((?:X{0,2}I{1,3}|IV|VI{0,3}|IX|X{1,2}V?I{0,3}|X{1,3}))\.\s+/g
  const matches = [...text.matchAll(re)]
  if (matches.length < 2) return null

  const intro = text.slice(0, matches[0].index!).trim()
  const items: string[] = matches.map((m, i) => {
    const contentStart = m.index! + m[0].length
    const contentEnd = i + 1 < matches.length ? matches[i + 1].index! : text.length
    return `${m[1]}. ${text.slice(contentStart, contentEnd).trim()}`
  })
  return { intro, items }
}

function QuestionText({ text }: { text: string }) {
  // Normalise once up front so the Roman-numeral split runs over repaired
  // text rather than raw import damage, and each fragment is already clean.
  const normalized = normalizeText(text, { kind: "question" })
  const parsed = parseRomanList(normalized)

  if (!parsed) {
    return <p className="text-base leading-relaxed md:text-lg">{renderMarkup(normalized)}</p>
  }
  return (
    <div className="space-y-2 text-base leading-relaxed md:text-lg">
      {parsed.intro && <p>{renderMarkup(parsed.intro)}</p>}
      <div className="space-y-1 pl-1">
        {parsed.items.map((item, i) => (
          <p key={i} className="flex gap-2">
            <span className="shrink-0 font-semibold text-primary/80">
              {item.match(/^([IVX]+\.)/)?.[1]}
            </span>
            <span>{renderMarkup(item.replace(/^[IVX]+\.\s*/, ""))}</span>
          </p>
        ))}
      </div>
    </div>
  )
}

type Props = {
  question: QuestionWithOptions
  selected: string | null
  flagged: boolean
  localIndex: number
  totalInSubject: number
  globalTotal: number
  onSelect: (optionId: string) => void
  onFlag: () => void
  onPrev: () => void
  onNext: () => void
  hasPrev: boolean
  hasNext: boolean
}

const OPTION_COLORS: Record<string, { selected: string; idle: string; label: string }> = {
  A: {
    selected: "border-violet-500 bg-violet-500 text-white",
    idle:     "border-border bg-background hover:border-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/30",
    label:    "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300",
  },
  B: {
    selected: "border-sky-500 bg-sky-500 text-white",
    idle:     "border-border bg-background hover:border-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/30",
    label:    "bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300",
  },
  C: {
    selected: "border-emerald-500 bg-emerald-500 text-white",
    idle:     "border-border bg-background hover:border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30",
    label:    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  },
  D: {
    selected: "border-rose-500 bg-rose-500 text-white",
    idle:     "border-border bg-background hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30",
    label:    "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300",
  },
}

export function QuestionCard({
  question,
  selected,
  flagged,
  localIndex,
  totalInSubject,
  onSelect,
  onFlag,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: Props) {
  return (
    <div className="space-y-5">

      {/* ── Question header ── */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          {question.year && (
            <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {question.year}
            </span>
          )}
          <p className="text-xs font-semibold text-muted-foreground">
            Question {localIndex + 1} <span className="text-muted-foreground/60">of {totalInSubject}</span>
          </p>
        </div>
        <button
          onClick={onFlag}
          className={cn(
            "flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition-all active:scale-95",
            flagged
              ? "border-amber-300 bg-amber-50 text-amber-600 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
              : "border-border text-muted-foreground hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600"
          )}
        >
          <Flag className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{flagged ? "Flagged" : "Flag"}</span>
        </button>
      </div>

      {/* ── Passage (comprehension) ── */}
      {question.passage && <PassagePanel passage={question.passage} />}

      {/* ── Question image ── */}
      {question.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={question.image_url}
          alt="Question"
          className="w-full rounded-2xl border object-contain"
        />
      )}

      {/* ── Question text ── */}
      <div className="rounded-2xl border bg-muted/20 px-5 py-4">
        <QuestionText text={question.text} />
      </div>

      {/* ── Options ── */}
      <div className="space-y-2.5">
        {question.options.map((opt) => {
          const isSelected = selected === opt.id
          const colors = OPTION_COLORS[opt.label] ?? OPTION_COLORS.A

          return (
            <button
              key={opt.id}
              onClick={() => onSelect(opt.id)}
              className={cn(
                "group flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all duration-150 active:scale-[0.99]",
                isSelected ? colors.selected : colors.idle
              )}
            >
              <span className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black transition-all",
                isSelected
                  ? "bg-white/25 text-inherit"
                  : colors.label
              )}>
                {opt.label}
              </span>
              <RichText
                text={opt.text}
                kind="option"
                className={cn(
                  "flex-1 text-sm leading-relaxed md:text-base",
                  isSelected ? "font-semibold" : "font-medium"
                )}
              />
            </button>
          )
        })}
      </div>

      {/* ── Prev / Next ── */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all hover:bg-muted active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" /> Previous
        </button>
        <button
          onClick={onNext}
          disabled={!hasNext}
          className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all hover:bg-muted active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30"
        >
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>

    </div>
  )
}
