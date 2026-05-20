import { getAppUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"
import { Zap } from "lucide-react"
import Link from "next/link"
import { todayWAT } from "@/lib/utils"
import { DrillPickerClient } from "./DrillPickerClient"

export const metadata = { title: "Timed Drill — PrepIQ" }

function formatMs(ms: number) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  const sec = s % 60
  if (m === 0) return `${s}s`
  return `${m}m ${sec.toString().padStart(2, "0")}s`
}

export default async function DrillPage() {
  const user = await getAppUser()
  if (!user) redirect("/login")

  const admin = createAdminClient()
  const today = todayWAT()

  // Fetch all schools for display
  const { data: schools } = await admin.from("schools").select("id, name, abbreviation").order("name")

  // Check if user has a target school set
  const { data: profile } = await admin
    .from("profiles")
    .select("target_school")
    .eq("id", user.id)
    .maybeSingle()

  const targetSchool = (profile?.target_school as string | null)?.trim().toUpperCase() || null

  // Subjects with bank questions — HEAD count per subject bypasses PostgREST max_rows
  const { data: allSubjectsForDrill } = await admin.from("subjects").select("id, name").order("name")
  const drillSubjects: { id: string; name: string }[] = []
  await Promise.all(
    (allSubjectsForDrill ?? []).map(async (s) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { count } = await (admin as any)
        .from("questions")
        .select("*", { count: "exact", head: true })
        .eq("is_bank_question", true)
        .eq("subject_id", s.id)
      if (count && count > 0) drillSubjects.push(s)
    })
  )
  drillSubjects.sort((a, b) => a.name.localeCompare(b.name))
  const subjects = drillSubjects

  type SessionRow = { id: string; score: number; total_answered: number; time_used_ms: number; completed_at: string | null; school_key: string }
  // Check today's session — new table, cast to any to bypass stale TS schema
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: todaySession } = await (admin as any)
    .from("drill_sessions")
    .select("id, score, total_answered, time_used_ms, completed_at, school_key")
    .eq("user_id", user.id)
    .eq("session_date", today)
    .maybeSingle() as { data: SessionRow | null }

  const hasCompleted = !!todaySession?.completed_at
  const inProgress = todaySession && !todaySession.completed_at

  return (
    <div className="mx-auto max-w-lg space-y-6 p-4 pb-12 md:p-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-950/40">
          <Zap className="h-6 w-6 text-orange-500" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-tight">Timed Drill</h1>
          <p className="text-xs text-muted-foreground">Answer as many questions as you can before time runs out</p>
        </div>
      </div>

      {/* Rules card */}
      <div className="rounded-2xl border border-orange-200/60 bg-orange-50/50 p-4 dark:border-orange-800/40 dark:bg-orange-950/20 space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-orange-700 dark:text-orange-400">How it works</p>
        <ul className="space-y-1.5 text-sm text-orange-800 dark:text-orange-300">
          <li className="flex items-start gap-2"><span className="mt-0.5 shrink-0 text-orange-400">⏱</span> Each question has its own timer — answer before it runs out</li>
          <li className="flex items-start gap-2"><span className="mt-0.5 shrink-0 text-orange-400">📐</span> <strong>Maths / Physics</strong> — 20 seconds &nbsp;·&nbsp; <strong>Chemistry</strong> — 15 seconds</li>
          <li className="flex items-start gap-2"><span className="mt-0.5 shrink-0 text-orange-400">📝</span> <strong>All others</strong> — 10 seconds per question</li>
          <li className="flex items-start gap-2"><span className="mt-0.5 shrink-0 text-orange-400">📅</span> Fixed daily questions per school — everyone sees the same set</li>
          <li className="flex items-start gap-2"><span className="mt-0.5 shrink-0 text-orange-400">🏆</span> Ranked by correct answers, then by speed</li>
        </ul>
      </div>

      {/* Completed today */}
      {hasCompleted && (
        <div className="rounded-2xl border bg-background p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-black">Drill complete for today!</p>
              <p className="text-xs text-muted-foreground">New drill available tomorrow</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border bg-orange-50/60 dark:bg-orange-950/20 p-3 text-center">
              <p className="text-2xl font-black text-orange-600 dark:text-orange-400">{todaySession!.score}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Correct</p>
            </div>
            <div className="rounded-xl border bg-muted/40 p-3 text-center">
              <p className="text-2xl font-black">{todaySession!.total_answered}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Answered</p>
            </div>
            <div className="rounded-xl border bg-muted/40 p-3 text-center">
              <p className="text-lg font-black tabular-nums">{formatMs(todaySession!.time_used_ms)}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Time used</p>
            </div>
          </div>
          <Link
            href="/leaderboard?tab=drill"
            className="flex items-center justify-center gap-2 rounded-xl border border-orange-300 bg-orange-50 px-4 py-2.5 text-sm font-bold text-orange-700 transition-colors hover:bg-orange-100 dark:border-orange-700 dark:bg-orange-950/30 dark:text-orange-300"
          >
            View Drill Leaderboard
          </Link>
        </div>
      )}

      {/* School info + subject picker + start */}
      {!hasCompleted && (
        <div className="space-y-3">
          <div className="rounded-2xl border bg-background px-4 py-3 space-y-1">
            <p className="text-sm font-bold">Your school</p>
            {targetSchool ? (
              <p className="text-xs text-muted-foreground">
                Default questions from <strong className="text-foreground">{targetSchool}</strong> — or pick subjects below.
              </p>
            ) : (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                No target school set — you&apos;ll see general questions.{" "}
                <Link href="/profile" className="underline font-semibold">Set your school →</Link>
              </p>
            )}
          </div>

          {inProgress && (
            <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 dark:bg-amber-950/30 dark:border-amber-700">
              <Zap className="h-4 w-4 text-amber-500 shrink-0" />
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                Session in progress — {todaySession!.total_answered} answered, {todaySession!.score} correct
              </p>
            </div>
          )}

          <DrillPickerClient
            subjects={subjects ?? []}
            inProgress={!!inProgress}
            defaultSchoolKey={targetSchool}
          />
        </div>
      )}

      {/* School list */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Available schools</p>
        <div className="grid grid-cols-2 gap-2">
          {(schools ?? []).map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-2 rounded-xl border bg-background px-3 py-2.5"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[10px] font-black text-primary">
                {s.abbreviation.slice(0, 3)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold">{s.abbreviation}</p>
                <p className="truncate text-[10px] text-muted-foreground">{s.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
