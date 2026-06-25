"use client"

import { useState, useMemo, useEffect, type ComponentType } from "react"
import { useRouter } from "next/navigation"
import { createChallenge } from "@/actions/challenge.actions"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Swords, Clock, BookOpen, Loader2, Copy, Check, School as SchoolIcon, Shuffle, Globe, ChevronLeft, ChevronRight } from "lucide-react"

type Subject    = { id: string; name: string; count: number }
type SchoolItem = { id: string; name: string; abbreviation: string; count: number }
type SchoolSource = "all" | "specific" | "random"

const TIME_OPTIONS = [
  { label: "5 min",  secs: 300  },
  { label: "10 min", secs: 600  },
  { label: "15 min", secs: 900  },
  { label: "20 min", secs: 1200 },
  { label: "30 min", secs: 1800 },
]
const Q_OPTIONS = [10, 20, 30, 40]
const SCHOOLS_PER_PAGE = 6

const SOURCE_OPTIONS: { value: SchoolSource; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { value: "all",      label: "All schools",   icon: Globe      },
  { value: "specific", label: "Pick a school", icon: SchoolIcon },
  { value: "random",   label: "Random school", icon: Shuffle    },
]

type Props = {
  subjects: Subject[]
  schools: SchoolItem[]
  subjectSchoolCounts: Record<string, Record<string, number>>
}

export function NewChallengeClient({ subjects, schools, subjectSchoolCounts }: Props) {
  const router = useRouter()
  const [loading, setLoading]             = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<string>(subjects[0]?.id ?? "")
  const [numQuestions, setNumQuestions]   = useState(20)
  const [timeLimitSecs, setTimeLimitSecs] = useState(1200)
  const [schoolSource, setSchoolSource]   = useState<SchoolSource>("all")
  const [selectedSchool, setSelectedSchool] = useState<string>("")
  const [schoolPage, setSchoolPage]       = useState(0)
  const [created, setCreated]             = useState<{ code: string; participantId: string } | null>(null)
  const [copied, setCopied]               = useState(false)

  const appUrl   = typeof window !== "undefined" ? window.location.origin : ""
  const shareUrl = created ? `${appUrl}/challenge/${created.code}` : ""

  // Schools that have questions for the selected subject
  const filteredSchools = useMemo(() => {
    const countsForSubject = subjectSchoolCounts[selectedSubject] ?? {}
    return schools.filter((sc) => (countsForSubject[sc.id] ?? 0) >= 1)
  }, [selectedSubject, schools, subjectSchoolCounts])

  const totalSchoolPages = Math.max(1, Math.ceil(filteredSchools.length / SCHOOLS_PER_PAGE))
  const pagedSchools     = filteredSchools.slice(schoolPage * SCHOOLS_PER_PAGE, (schoolPage + 1) * SCHOOLS_PER_PAGE)

  // Reset pagination + clear school when subject or source changes
  useEffect(() => {
    setSchoolPage(0)
    // If current school has no questions for new subject, clear it
    if (selectedSchool && !(subjectSchoolCounts[selectedSubject]?.[selectedSchool] >= 1)) {
      setSelectedSchool("")
    }
  }, [selectedSubject, schoolSource]) // eslint-disable-line

  // Question count shown on subject tiles — changes with school selection
  function getSubjectCount(subjectId: string): number {
    if (schoolSource === "specific" && selectedSchool) {
      return subjectSchoolCounts[subjectId]?.[selectedSchool] ?? 0
    }
    return subjects.find((s) => s.id === subjectId)?.count ?? 0
  }

  const maxAvailable = getSubjectCount(selectedSubject)

  // Auto-adjust numQuestions if it exceeds what's available
  useEffect(() => {
    if (maxAvailable > 0 && numQuestions > maxAvailable) {
      const fallback = Q_OPTIONS.filter((n) => n <= maxAvailable).at(-1)
      if (fallback) setNumQuestions(fallback)
    }
  }, [maxAvailable]) // eslint-disable-line

  async function handleCreate() {
    if (!selectedSubject) { toast.error("Select a subject"); return }
    if (schoolSource === "specific" && !selectedSchool) { toast.error("Pick a school"); return }
    setLoading(true)
    const result = await createChallenge(
      selectedSubject,
      numQuestions,
      timeLimitSecs,
      schoolSource,
      schoolSource === "specific" ? selectedSchool : undefined
    )
    setLoading(false)
    if (!result.success) {
      const msg = result.error === "INSUFFICIENT_QUESTIONS"
        ? "Not enough questions for that combination — try a different subject or school."
        : "Failed to create challenge — try again."
      toast.error(msg)
      return
    }
    try { localStorage.setItem(`challenge_${result.data.code}_pid`, result.data.participantId) } catch {}
    setCreated(result.data)
  }

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleShare() {
    const subjectName = subjects.find((s) => s.id === selectedSubject)?.name ?? "POST-UTME"
    if (navigator.share) {
      navigator.share({ title: "PrepIQ 1v1 Challenge", text: `I'm challenging you on ${subjectName}! Can you beat my score?`, url: shareUrl })
    } else {
      handleCopy()
    }
  }

  // ── Created state ──────────────────────────────────────────────────────────
  if (created) {
    return (
      <div className="mx-auto max-w-lg space-y-5 px-4 py-8">
        <div className="rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 p-6 text-white text-center space-y-2">
          <Swords className="mx-auto h-10 w-10 opacity-90" />
          <h2 className="text-2xl font-black">Challenge created!</h2>
          <p className="text-sm text-white/80">Share the link below to challenge a friend.</p>
        </div>

        <div className="rounded-2xl border bg-background p-4 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Challenge link</p>
          <div className="flex items-center gap-2 rounded-xl border bg-muted/50 px-3 py-2.5">
            <span className="flex-1 truncate text-sm font-mono">{shareUrl}</span>
            <button onClick={handleCopy} className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            Code: <span className="font-black text-foreground tracking-widest">{created.code}</span>
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 rounded-2xl border bg-background py-3 text-sm font-bold hover:bg-muted"
          >
            Share challenge
          </button>
          <button
            onClick={() => router.push(`/challenge/${created.code}/play?p=${created.participantId}`)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-base font-black text-primary-foreground shadow-lg shadow-primary/30 hover:opacity-90"
          >
            <Swords className="h-5 w-5" />
            Start playing now
          </button>
          <button
            onClick={() => setCreated(null)}
            className="text-center text-xs text-muted-foreground underline underline-offset-2"
          >
            Create another challenge
          </button>
        </div>
      </div>
    )
  }

  // ── Create form ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-full bg-background pb-12">
      {/* Hero */}
      <div className="bg-gradient-to-br from-amber-500 to-orange-600 px-5 py-8 text-white">
        <div className="mx-auto max-w-lg">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold">
            <Swords className="h-3.5 w-3.5" />
            1v1 Challenge
          </div>
          <h1 className="text-2xl font-black tracking-tight">Challenge a Friend</h1>
          <p className="mt-2 text-sm text-white/70 leading-relaxed">
            Set the subject, pick the school, and set your rules. Your opponent can play any time — even without an account.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-5 px-4 pt-6">

        {/* Subject */}
        <div className="rounded-2xl border bg-background p-4 space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Subject</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {subjects.map((s) => {
              const count = getSubjectCount(s.id)
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSubject(s.id)}
                  className={cn(
                    "rounded-xl border-2 px-3 py-2.5 text-left transition-all",
                    selectedSubject === s.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30 hover:bg-muted/30"
                  )}
                >
                  <p className={cn("text-sm font-bold truncate", selectedSubject === s.id ? "text-primary" : "text-foreground")}>
                    {s.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{count} question{count !== 1 ? "s" : ""}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* School source */}
        <div className="rounded-2xl border bg-background p-4 space-y-3">
          <div className="flex items-center gap-2">
            <SchoolIcon className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Question source</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {SOURCE_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setSchoolSource(value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-center transition-all",
                  schoolSource === value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30 hover:bg-muted/30"
                )}
              >
                <Icon className={cn("h-5 w-5", schoolSource === value ? "text-primary" : "text-muted-foreground")} />
                <span className={cn("text-xs font-bold leading-tight", schoolSource === value ? "text-primary" : "text-foreground")}>
                  {label}
                </span>
              </button>
            ))}
          </div>

          {/* School picker with pagination */}
          {schoolSource === "specific" && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Choose a school: <span className="font-semibold text-foreground">{filteredSchools.length} available</span>
                </p>
                {totalSchoolPages > 1 && (
                  <p className="text-xs text-muted-foreground">
                    {schoolPage + 1} / {totalSchoolPages}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {pagedSchools.map((sc) => {
                  const count = subjectSchoolCounts[selectedSubject]?.[sc.id] ?? 0
                  return (
                    <button
                      key={sc.id}
                      onClick={() => setSelectedSchool(sc.id)}
                      className={cn(
                        "rounded-xl border-2 px-3 py-2.5 text-left transition-all",
                        selectedSchool === sc.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30 hover:bg-muted/30"
                      )}
                    >
                      <p className={cn("text-sm font-black truncate", selectedSchool === sc.id ? "text-primary" : "text-foreground")}>
                        {sc.abbreviation}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{sc.name}</p>
                      <p className="text-xs text-muted-foreground">{count} q</p>
                    </button>
                  )
                })}
              </div>

              {/* Pagination controls */}
              {totalSchoolPages > 1 && (
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => setSchoolPage((p) => Math.max(0, p - 1))}
                    disabled={schoolPage === 0}
                    className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-40 hover:bg-muted"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Prev
                  </button>
                  <div className="flex gap-1">
                    {Array.from({ length: totalSchoolPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setSchoolPage(i)}
                        className={cn(
                          "h-2 w-2 rounded-full transition-colors",
                          i === schoolPage ? "bg-primary" : "bg-muted-foreground/30"
                        )}
                      />
                    ))}
                  </div>
                  <button
                    onClick={() => setSchoolPage((p) => Math.min(totalSchoolPages - 1, p + 1))}
                    disabled={schoolPage === totalSchoolPages - 1}
                    className="flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold disabled:opacity-40 hover:bg-muted"
                  >
                    Next
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {schoolSource === "random" && (
            <p className="text-xs text-muted-foreground rounded-xl bg-muted/50 px-3 py-2">
              <Shuffle className="inline h-3 w-3 mr-1" />
              We&apos;ll randomly pick a school that has questions for your selected subject. Both players won&apos;t know which one until the challenge is accepted.
            </p>
          )}
        </div>

        {/* Number of questions */}
        <div className="rounded-2xl border bg-background p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Number of Questions</p>
            {schoolSource === "specific" && selectedSchool && maxAvailable > 0 && (
              <p className="text-xs text-muted-foreground">{maxAvailable} available</p>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {Q_OPTIONS.map((n) => {
              const unavailable = schoolSource === "specific" && selectedSchool && n > maxAvailable
              return (
                <button
                  key={n}
                  onClick={() => !unavailable && setNumQuestions(n)}
                  className={cn(
                    "rounded-xl border-2 py-2.5 text-sm font-black transition-all",
                    unavailable
                      ? "border-border opacity-30 cursor-not-allowed"
                      : numQuestions === n
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border hover:border-primary/30"
                  )}
                >
                  {n}
                </button>
              )
            })}
          </div>
        </div>

        {/* Time */}
        <div className="rounded-2xl border bg-background p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Time Limit</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {TIME_OPTIONS.map((t) => (
              <button
                key={t.secs}
                onClick={() => setTimeLimitSecs(t.secs)}
                className={cn(
                  "rounded-xl border-2 px-4 py-2 text-sm font-bold transition-all",
                  timeLimitSecs === t.secs ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/30"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleCreate}
          disabled={loading || !selectedSubject || (schoolSource === "specific" && !selectedSchool)}
          className={cn(
            "flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-base font-black transition-all",
            !loading && selectedSubject && !(schoolSource === "specific" && !selectedSchool)
              ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:opacity-90 active:scale-[0.98]"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Swords className="h-5 w-5" />}
          {loading ? "Creating…" : "Create Challenge"}
        </button>
      </div>
    </div>
  )
}
