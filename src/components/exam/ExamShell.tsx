"use client"

import { useEffect, useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useExamStore } from "@/store/examStore"
import { submitExam } from "@/actions/exam.actions"
import { QuestionCard } from "./QuestionCard"
import { QuestionNavigator } from "./QuestionNavigator"
import { ExamTimer } from "./ExamTimer"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { LayoutGrid, X, AlertTriangle } from "lucide-react"
import type { QuestionWithOptions } from "@/types"

type SubjectGroup = { id: string; name: string; questions: QuestionWithOptions[] }

type Props = {
  attemptId: string
  questions: QuestionWithOptions[]
  timeLimitSecs: number
}

export function ExamShell({ attemptId, questions, timeLimitSecs }: Props) {
  const router = useRouter()
  const {
    currentIndex, answers, flagged, timeLeft,
    isSubmitting, init, selectAnswer, toggleFlag,
    goTo, tick, setSubmitting, reset,
  } = useExamStore()

  const [showNavigator, setShowNavigator] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    init(attemptId, questions, timeLimitSecs)
    return () => reset()
  }, [attemptId]) // eslint-disable-line

  // Build subject groups (English always first)
  const subjects = useMemo<SubjectGroup[]>(() => {
    const map = new Map<string, SubjectGroup>()
    for (const q of questions) {
      if (!map.has(q.subject_id)) map.set(q.subject_id, { id: q.subject_id, name: q.subject.name, questions: [] })
      map.get(q.subject_id)!.questions.push(q)
    }
    return Array.from(map.values()).sort((a, b) => {
      if (a.name.toLowerCase().includes("english")) return -1
      if (b.name.toLowerCase().includes("english")) return 1
      return a.name.localeCompare(b.name)
    })
  }, [questions])

  const [activeSubjectId, setActiveSubjectId] = useState(() => subjects[0]?.id ?? "")

  const activeGroup = subjects.find(s => s.id === activeSubjectId) ?? subjects[0]
  const activeQuestions = activeGroup?.questions ?? []

  // Local index within the active subject's questions
  const localIndex = Math.max(0, activeQuestions.findIndex(q => q.id === questions[currentIndex]?.id))

  function switchSubject(subjectId: string) {
    setActiveSubjectId(subjectId)
    const group = subjects.find(s => s.id === subjectId)
    if (!group) return
    // Go to first unanswered question in this subject, else first question
    const target = group.questions.find(q => !answers[q.id]) ?? group.questions[0]
    if (target) {
      const gi = questions.findIndex(q => q.id === target.id)
      if (gi >= 0) goTo(gi)
    }
  }

  function goLocalPrev() {
    const prev = localIndex - 1
    if (prev < 0) return
    const gi = questions.findIndex(q => q.id === activeQuestions[prev].id)
    if (gi >= 0) goTo(gi)
  }

  function goLocalNext() {
    const next = localIndex + 1
    if (next >= activeQuestions.length) return
    const gi = questions.findIndex(q => q.id === activeQuestions[next].id)
    if (gi >= 0) goTo(gi)
  }

  function handleSelectAnswer(questionId: string, optionId: string) {
    const isFirstAnswer = !answers[questionId]
    selectAnswer(questionId, optionId)
    // Auto-advance to next question after a short delay on first selection
    if (isFirstAnswer) {
      const next = localIndex + 1
      if (next < activeQuestions.length) {
        setTimeout(() => {
          const gi = questions.findIndex(q => q.id === activeQuestions[next].id)
          if (gi >= 0) goTo(gi)
        }, 600)
      }
    }
  }

  const doSubmit = useCallback(async (timedOut = false) => {
    if (isSubmitting) return
    setSubmitting(true)
    setShowConfirm(false)
    const result = await submitExam({
      attemptId,
      answers: Object.entries(answers).map(([questionId, selectedOptionId]) => ({ questionId, selectedOptionId })),
      timeTakenSecs: timedOut ? timeLimitSecs : timeLimitSecs - timeLeft,
    })
    if (!result.success) {
      toast.error("Failed to submit — please try again.")
      setSubmitting(false)
      return
    }
    router.push(`/results/${attemptId}`)
  }, [attemptId, answers, isSubmitting, timeLeft, timeLimitSecs]) // eslint-disable-line

  // Auto-submit on timeout
  useEffect(() => {
    if (timeLeft <= 0) { doSubmit(true); return }
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [timeLeft]) // eslint-disable-line

  if (!questions.length || !activeGroup) return null

  const currentQ = questions[currentIndex]
  const answeredCount = Object.values(answers).filter(Boolean).length
  const unansweredCount = questions.length - answeredCount

  return (
    <div className="flex h-[100dvh] flex-col bg-background overflow-hidden">

      {/* ══ Top Header ══════════════════════════════════════════════════ */}
      <header className="z-20 flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 px-3 backdrop-blur-sm md:px-5">
        {/* Mobile: progress pill */}
        <div className="flex min-w-0 flex-1 items-center gap-2 md:hidden">
          <span className="rounded-lg bg-muted px-2 py-1 text-xs font-bold tabular-nums">
            {answeredCount}<span className="font-normal text-muted-foreground">/{questions.length}</span>
          </span>
        </div>
        {/* Desktop: label */}
        <div className="hidden flex-1 items-center md:flex">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            POST-UTME Exam
          </span>
        </div>

        <ExamTimer timeLeft={timeLeft} totalSecs={timeLimitSecs} />

        <div className="flex items-center gap-2">
          {/* Navigator toggle — mobile only */}
          <button
            onClick={() => setShowNavigator(true)}
            className="flex items-center gap-1.5 rounded-xl border bg-muted/50 px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-muted md:hidden"
            aria-label="Open navigator"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={() => setShowConfirm(true)}
            disabled={isSubmitting}
            className="rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60 md:px-4 md:py-2 md:text-sm"
          >
            {isSubmitting ? "Saving…" : "Submit"}
          </button>
        </div>
      </header>

      {/* ══ Subject Tabs ════════════════════════════════════════════════ */}
      <div className="z-10 shrink-0 border-b bg-background shadow-sm">
        <div className="flex overflow-x-auto px-3 md:px-5" style={{ scrollbarWidth: "none" }}>
          {subjects.map((s) => {
            const answered = s.questions.filter(q => answers[q.id]).length
            const isActive = s.id === activeSubjectId
            const allDone  = answered === s.questions.length

            return (
              <button
                key={s.id}
                onClick={() => switchSubject(s.id)}
                className={cn(
                  "relative flex shrink-0 flex-col items-center gap-0.5 px-4 py-2.5 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="whitespace-nowrap text-xs font-bold">{s.name}</span>
                <span className={cn(
                  "text-[10px] font-semibold tabular-nums",
                  allDone ? "text-emerald-500" : isActive ? "text-primary/60" : "text-muted-foreground/60"
                )}>
                  {answered}/{s.questions.length}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ══ Body ════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden">

        {/* Question area */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-2xl px-4 py-5 pb-20 md:px-6 md:pb-8 md:py-8">
            <QuestionCard
              question={currentQ}
              selected={answers[currentQ.id] ?? null}
              flagged={flagged.has(currentQ.id)}
              localIndex={localIndex}
              totalInSubject={activeQuestions.length}
              globalTotal={questions.length}
              onSelect={(optionId) => handleSelectAnswer(currentQ.id, optionId)}
              onFlag={() => toggleFlag(currentQ.id)}
              onPrev={goLocalPrev}
              onNext={goLocalNext}
              hasPrev={localIndex > 0}
              hasNext={localIndex < activeQuestions.length - 1}
            />
          </div>
        </main>

        {/* Desktop sidebar navigator */}
        <aside className="hidden w-56 shrink-0 flex-col overflow-y-auto border-l bg-muted/10 p-4 md:flex">
          <QuestionNavigator
            subjects={subjects}
            questions={questions}
            answers={answers}
            flagged={flagged}
            currentQuestionId={currentQ.id}
            onSelect={(gi) => {
              goTo(gi)
              const tq = questions[gi]
              if (tq && tq.subject_id !== activeSubjectId) setActiveSubjectId(tq.subject_id)
            }}
          />
          <p className="mt-4 border-t pt-3 text-center text-[11px] text-muted-foreground">
            {answeredCount} of {questions.length} answered
          </p>
        </aside>

      </div>

      {/* ══ Mobile Bottom Nav ═══════════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-20 flex h-14 shrink-0 items-center justify-center border-t bg-background/95 backdrop-blur-sm md:hidden">
        <button
          onClick={() => setShowNavigator(true)}
          className="flex items-center gap-2 rounded-xl border bg-muted/50 px-4 py-2 text-xs font-semibold"
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          All Questions · {answeredCount}/{questions.length} answered
        </button>
      </div>

      {/* ══ Mobile Navigator Sheet ═══════════════════════════════════════ */}
      {showNavigator && (
        <>
          <div
            className="fixed inset-0 z-30 bg-black/50 md:hidden"
            onClick={() => setShowNavigator(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-40 max-h-[75dvh] overflow-y-auto rounded-t-3xl border-t bg-background px-5 pb-8 pt-5 md:hidden">
            <div className="mb-5 flex items-center justify-between">
              <p className="font-black text-base">Questions</p>
              <button
                onClick={() => setShowNavigator(false)}
                className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <QuestionNavigator
              subjects={subjects}
              questions={questions}
              answers={answers}
              flagged={flagged}
              currentQuestionId={currentQ.id}
              onSelect={(gi) => {
                goTo(gi)
                const tq = questions[gi]
                if (tq) setActiveSubjectId(tq.subject_id)
                setShowNavigator(false)
              }}
            />
            <p className="mt-5 border-t pt-4 text-center text-xs text-muted-foreground">
              {answeredCount} of {questions.length} answered
            </p>
          </div>
        </>
      )}

      {/* ══ Submit Confirmation Modal ════════════════════════════════════ */}
      {showConfirm && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowConfirm(false)}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl border bg-background p-6 shadow-2xl">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/40">
              <AlertTriangle className="h-7 w-7 text-amber-600 dark:text-amber-400" />
            </div>
            <h2 className="text-lg font-black">Submit exam?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              You have answered <strong className="text-foreground">{answeredCount}</strong> of{" "}
              <strong className="text-foreground">{questions.length}</strong> questions.
              {unansweredCount > 0 && (
                <> <span className="text-amber-600 font-semibold">{unansweredCount} unanswered</span> will be marked incorrect.</>
              )}
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-2xl border py-3 text-sm font-bold transition-colors hover:bg-muted"
              >
                Keep Going
              </button>
              <button
                onClick={() => doSubmit(false)}
                disabled={isSubmitting}
                className="flex-1 rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {isSubmitting ? "Saving…" : "Submit Now"}
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  )
}
