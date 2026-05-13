"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getAppUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import type { ActionResult } from "@/types"

async function requireAttendantOrAdmin() {
  const user = await getAppUser()
  if (!user) throw new Error("UNAUTHORIZED")
  if (user.role === "ADMIN") return user

  const admin = createAdminClient()
  const { data } = await admin
    .from("log_attendants")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (!data) throw new Error("NOT_ATTENDANT")
  return user
}

export async function isLogAttendant(): Promise<boolean> {
  const user = await getAppUser()
  if (!user) return false
  if (user.role === "ADMIN") return true

  const admin = createAdminClient()
  const { data } = await admin
    .from("log_attendants")
    .select("id")
    .eq("user_id", user.id)
    .single()

  return !!data
}

// ── Sessions ──────────────────────────────────────────────────────────────────

export async function getOrCreateTodaySession(): Promise<ActionResult<{ id: string; session_date: string; title: string | null }>> {
  try { await requireAttendantOrAdmin() } catch (e: unknown) {
    return { success: false, error: (e as Error).message }
  }

  const user = await getAppUser()
  const admin = createAdminClient()
  const today = new Date().toISOString().split("T")[0]

  const { data: existing } = await admin
    .from("brainstorm_sessions")
    .select("id, session_date, title")
    .eq("session_date", today)
    .single()

  if (existing) return { success: true, data: existing }

  const { data, error } = await admin
    .from("brainstorm_sessions")
    .insert({ session_date: today, created_by: user!.id })
    .select("id, session_date, title")
    .single()

  if (error || !data) return { success: false, error: "INTERNAL" }
  return { success: true, data }
}

export async function getSession(date: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from("brainstorm_sessions")
    .select("id, session_date, title")
    .eq("session_date", date)
    .single()
  return data ?? null
}

export async function getAllSessionDates(): Promise<string[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from("brainstorm_sessions")
    .select("session_date")
    .order("session_date", { ascending: false })
  return (data ?? []).map((s) => s.session_date)
}

// ── Attendance ────────────────────────────────────────────────────────────────

export type AttendanceRow = {
  id: string
  student_id: string
  first_answers: number
  logged_by: string | null
  created_at: string
  student: { name: string; avatar_url: string | null; target_school: string | null } | null
}

export async function getSessionAttendance(sessionId: string): Promise<AttendanceRow[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from("brainstorm_attendance")
    .select("id, student_id, first_answers, logged_by, created_at, student:profiles!brainstorm_attendance_student_id_fkey(name, avatar_url, target_school)")
    .eq("session_id", sessionId)
    .order("first_answers", { ascending: false })

  return (data ?? []) as unknown as AttendanceRow[]
}

export async function addStudentToSession(
  sessionId: string,
  studentId: string
): Promise<ActionResult<AttendanceRow>> {
  try { await requireAttendantOrAdmin() } catch (e: unknown) {
    return { success: false, error: (e as Error).message }
  }

  const user = await getAppUser()
  const admin = createAdminClient()

  const { data, error } = await admin
    .from("brainstorm_attendance")
    .insert({ session_id: sessionId, student_id: studentId, logged_by: user!.id })
    .select("id, student_id, first_answers, logged_by, created_at, student:profiles!brainstorm_attendance_student_id_fkey(name, avatar_url, target_school)")
    .single()

  if (error) {
    if (error.code === "23505") return { success: false, error: "ALREADY_ADDED" }
    return { success: false, error: "INTERNAL" }
  }

  revalidatePath("/community/brainstorm")
  return { success: true, data: data as unknown as AttendanceRow }
}

export async function updateFirstAnswers(
  attendanceId: string,
  firstAnswers: number
): Promise<ActionResult<void>> {
  try { await requireAttendantOrAdmin() } catch (e: unknown) {
    return { success: false, error: (e as Error).message }
  }

  const admin = createAdminClient()
  const count = Math.max(0, firstAnswers)
  const { error } = await admin
    .from("brainstorm_attendance")
    .update({ first_answers: count })
    .eq("id", attendanceId)

  if (error) return { success: false, error: "INTERNAL" }
  revalidatePath("/community/brainstorm")
  return { success: true, data: undefined }
}

export async function removeFromSession(attendanceId: string): Promise<ActionResult<void>> {
  try { await requireAttendantOrAdmin() } catch (e: unknown) {
    return { success: false, error: (e as Error).message }
  }

  const admin = createAdminClient()
  await admin.from("brainstorm_attendance").delete().eq("id", attendanceId)
  revalidatePath("/community/brainstorm")
  return { success: true, data: undefined }
}

// Student search for attendant dropdown
export async function searchStudents(query: string, page = 1, limit = 20) {
  try { await requireAttendantOrAdmin() } catch {
    return { students: [], total: 0 }
  }

  const admin = createAdminClient()
  const from = (page - 1) * limit
  const to = from + limit - 1

  let q = admin
    .from("profiles")
    .select("id, name, avatar_url, target_school", { count: "exact" })
    .eq("role", "STUDENT")
    .eq("is_banned", false)
    .order("name")
    .range(from, to)

  if (query.trim()) {
    q = q.ilike("name", `%${query.trim()}%`)
  }

  const { data, count } = await q
  return { students: data ?? [], total: count ?? 0 }
}

// ── Admin: manage log attendants ──────────────────────────────────────────────

async function requireAdmin() {
  const user = await getAppUser()
  if (!user || user.role !== "ADMIN") throw new Error("UNAUTHORIZED")
  return user
}

export async function getLogAttendants() {
  try { await requireAdmin() } catch { return [] }

  const admin = createAdminClient()
  const { data } = await admin
    .from("log_attendants")
    .select("id, user_id, created_at, user:profiles!log_attendants_user_id_fkey(name, email, avatar_url)")
    .order("created_at", { ascending: false })

  return (data ?? []) as unknown as Array<{
    id: string
    user_id: string
    created_at: string
    user: { name: string; email: string | null; avatar_url: string | null } | null
  }>
}

export async function addLogAttendant(userId: string): Promise<ActionResult<void>> {
  try { await requireAdmin() } catch (e: unknown) {
    return { success: false, error: (e as Error).message }
  }

  const user = await getAppUser()
  const admin = createAdminClient()
  const { error } = await admin
    .from("log_attendants")
    .insert({ user_id: userId, granted_by: user!.id })

  if (error) {
    if (error.code === "23505") return { success: false, error: "ALREADY_ATTENDANT" }
    return { success: false, error: "INTERNAL" }
  }
  revalidatePath("/admin/log-attendants")
  return { success: true, data: undefined }
}

export async function removeLogAttendant(id: string): Promise<ActionResult<void>> {
  try { await requireAdmin() } catch (e: unknown) {
    return { success: false, error: (e as Error).message }
  }

  const admin = createAdminClient()
  await admin.from("log_attendants").delete().eq("id", id)
  revalidatePath("/admin/log-attendants")
  return { success: true, data: undefined }
}

// ══════════════════════════════════════════════════════════════════════════════
// ── Brainstorm v2: real-time Q&A ─────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════

// ── Host management ───────────────────────────────────────────────────────────

export async function isBrainstormHost(): Promise<boolean> {
  const user = await getAppUser()
  if (!user) return false
  if (user.role === "ADMIN") return true
  const admin = createAdminClient()
  const { data } = await admin
    .from("brainstorm_hosts")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single()
  return !!data
}

// Host-specific session get-or-create: doesn't require log_attendant role,
// and returns is_live so the panel restores live state after a refresh.
export async function getOrCreateTodayHostSession(): Promise<ActionResult<{
  id: string
  session_date: string
  title: string | null
  is_live: boolean
}>> {
  const user = await getAppUser()
  if (!user) return { success: false, error: "UNAUTHORIZED" }

  const host = await isBrainstormHost()
  if (!host) return { success: false, error: "FORBIDDEN" }

  const admin = createAdminClient()
  const today = new Date().toISOString().split("T")[0]

  const { data: existing } = await admin
    .from("brainstorm_sessions")
    .select("id, session_date, title, is_live")
    .eq("session_date", today)
    .single()

  if (existing) return { success: true, data: { ...existing, is_live: existing.is_live ?? false } }

  const { data, error } = await admin
    .from("brainstorm_sessions")
    .insert({ session_date: today, created_by: user.id })
    .select("id, session_date, title, is_live")
    .single()

  if (error || !data) return { success: false, error: "INTERNAL" }
  return { success: true, data: { ...data, is_live: data.is_live ?? false } }
}

export type BrainstormHostRow = {
  id: string
  user_id: string
  is_active: boolean
  created_at: string
  user: { name: string; email: string | null; avatar_url: string | null } | null
}

export async function getBrainstormHosts(): Promise<BrainstormHostRow[]> {
  try { await requireAdmin() } catch { return [] }
  const admin = createAdminClient()
  const { data } = await admin
    .from("brainstorm_hosts")
    .select("id, user_id, is_active, created_at, user:profiles!brainstorm_hosts_user_id_fkey(name, email, avatar_url)")
    .order("created_at", { ascending: false })
  return (data ?? []) as unknown as BrainstormHostRow[]
}

export async function addBrainstormHost(userId: string): Promise<ActionResult<void>> {
  try { await requireAdmin() } catch (e: unknown) {
    return { success: false, error: (e as Error).message }
  }
  const user = await getAppUser()
  const admin = createAdminClient()
  const { error } = await admin
    .from("brainstorm_hosts")
    .upsert({ user_id: userId, granted_by: user!.id, is_active: true }, { onConflict: "user_id" })
  if (error) return { success: false, error: "INTERNAL" }
  revalidatePath("/admin/brainstorm-hosts")
  return { success: true, data: undefined }
}

export async function toggleBrainstormHost(id: string, isActive: boolean): Promise<ActionResult<void>> {
  try { await requireAdmin() } catch (e: unknown) {
    return { success: false, error: (e as Error).message }
  }
  const admin = createAdminClient()
  const { error } = await admin.from("brainstorm_hosts").update({ is_active: isActive }).eq("id", id)
  if (error) return { success: false, error: "INTERNAL" }
  revalidatePath("/admin/brainstorm-hosts")
  return { success: true, data: undefined }
}

export async function removeBrainstormHost(id: string): Promise<ActionResult<void>> {
  try { await requireAdmin() } catch (e: unknown) {
    return { success: false, error: (e as Error).message }
  }
  const admin = createAdminClient()
  await admin.from("brainstorm_hosts").delete().eq("id", id)
  revalidatePath("/admin/brainstorm-hosts")
  return { success: true, data: undefined }
}

// ── Session lifecycle ─────────────────────────────────────────────────────────

async function requireHost() {
  const user = await getAppUser()
  if (!user) throw new Error("UNAUTHORIZED")
  if (user.role === "ADMIN") return user
  const admin = createAdminClient()
  const { data } = await admin
    .from("brainstorm_hosts")
    .select("id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single()
  if (!data) throw new Error("NOT_HOST")
  return user
}

export async function startLiveSession(sessionId: string): Promise<ActionResult<void>> {
  try { await requireHost() } catch (e: unknown) {
    return { success: false, error: (e as Error).message }
  }
  const admin = createAdminClient()
  const { error } = await admin
    .from("brainstorm_sessions")
    .update({ is_live: true, ended_at: null })
    .eq("id", sessionId)
  if (error) return { success: false, error: "INTERNAL" }
  revalidatePath("/community/brainstorm")
  return { success: true, data: undefined }
}

export async function endLiveSession(sessionId: string): Promise<ActionResult<void>> {
  try { await requireHost() } catch (e: unknown) {
    return { success: false, error: (e as Error).message }
  }
  const admin = createAdminClient()
  const { error } = await admin
    .from("brainstorm_sessions")
    .update({ is_live: false, ended_at: new Date().toISOString() })
    .eq("id", sessionId)
  if (error) return { success: false, error: "INTERNAL" }
  revalidatePath("/community/brainstorm")
  return { success: true, data: undefined }
}

export async function getLiveSession() {
  const admin = createAdminClient()
  const { data } = await admin
    .from("brainstorm_sessions")
    .select("id, session_date, title, is_live, created_by")
    .eq("is_live", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()
  return data ?? null
}

// ── Questions ─────────────────────────────────────────────────────────────────

export type GeneralQuestion = {
  id: string
  text: string
  year: number | null
  subject: { id: string; name: string }
  options: { id: string; label: string; text: string; is_correct: boolean }[]
}

export async function getGeneralQuestions(
  subjectId?: string,
  search?: string,
  page = 1,
  limit = 20
): Promise<{ questions: GeneralQuestion[]; total: number }> {
  const admin = createAdminClient()

  const { data: generalSchool } = await admin
    .from("schools")
    .select("id")
    .eq("abbreviation", "GENERAL")
    .single()

  if (!generalSchool) return { questions: [], total: 0 }

  const from = (page - 1) * limit
  const to = from + limit - 1

  let q = admin
    .from("questions")
    .select(`id, text, year, subject:subjects(id, name), options(id, label, text, is_correct)`, { count: "exact" })
    .eq("school_id", generalSchool.id)
    .order("subject_id")
    .order("year", { ascending: false, nullsFirst: false })
    .range(from, to)

  if (subjectId) q = q.eq("subject_id", subjectId) as typeof q
  if (search?.trim()) q = q.ilike("text", `%${search.trim()}%`) as typeof q

  const { data, count } = await q
  return {
    questions: (data ?? []) as unknown as GeneralQuestion[],
    total: count ?? 0,
  }
}

export async function pushQuestion(
  sessionId: string,
  questionId: string
): Promise<ActionResult<{ id: string }>> {
  let user: Awaited<ReturnType<typeof requireHost>>
  try { user = await requireHost() } catch (e: unknown) {
    return { success: false, error: (e as Error).message }
  }

  const admin = createAdminClient()

  const { data: last } = await admin
    .from("brainstorm_pushed_questions")
    .select("push_order")
    .eq("session_id", sessionId)
    .order("push_order", { ascending: false })
    .limit(1)
    .single()

  const push_order = (last?.push_order ?? 0) + 1

  const { data, error } = await admin
    .from("brainstorm_pushed_questions")
    .insert({ session_id: sessionId, question_id: questionId, pushed_by: user.id, push_order })
    .select("id")
    .single()

  if (error) {
    if (error.code === "23505") return { success: false, error: "ALREADY_PUSHED" }
    return { success: false, error: "INTERNAL" }
  }

  return { success: true, data: { id: data.id } }
}

export type PushedQuestion = {
  id: string
  session_id: string
  push_order: number
  pushed_at: string
  question: GeneralQuestion
}

export async function getCurrentQuestion(sessionId: string): Promise<PushedQuestion | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from("brainstorm_pushed_questions")
    .select(`id, session_id, push_order, pushed_at, question:questions(id, text, year, subject:subjects(id, name), options(id, label, text, is_correct))`)
    .eq("session_id", sessionId)
    .order("push_order", { ascending: false })
    .limit(1)
    .single()
  return data ? (data as unknown as PushedQuestion) : null
}

export async function getPushedQuestionById(pushedId: string): Promise<PushedQuestion | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from("brainstorm_pushed_questions")
    .select(`id, session_id, push_order, pushed_at, question:questions(id, text, year, subject:subjects(id, name), options(id, label, text, is_correct))`)
    .eq("id", pushedId)
    .single()
  return data ? (data as unknown as PushedQuestion) : null
}

export async function getSessionPushedQuestions(sessionId: string): Promise<PushedQuestion[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from("brainstorm_pushed_questions")
    .select(`id, session_id, push_order, pushed_at, question:questions(id, text, year, subject:subjects(id, name), options(id, label, text, is_correct))`)
    .eq("session_id", sessionId)
    .order("push_order", { ascending: true })
  return (data ?? []) as unknown as PushedQuestion[]
}

// ── Answers & leaderboard ─────────────────────────────────────────────────────

export async function submitBrainstormAnswer(
  pushedQuestionId: string,
  selectedOptionId: string
): Promise<ActionResult<{ isCorrect: boolean; pointsAwarded: number }>> {
  const user = await getAppUser()
  if (!user) return { success: false, error: "UNAUTHORIZED" }

  const admin = createAdminClient()

  const { data: option } = await admin
    .from("options")
    .select("is_correct")
    .eq("id", selectedOptionId)
    .single()

  if (!option) return { success: false, error: "INVALID_OPTION" }
  const isCorrect = option.is_correct

  let pointsAwarded = 0
  if (isCorrect) {
    const { count } = await admin
      .from("brainstorm_answers")
      .select("id", { count: "exact", head: true })
      .eq("pushed_question_id", pushedQuestionId)
      .eq("is_correct", true)

    const rank = count ?? 0
    pointsAwarded = rank === 0 ? 10 : rank === 1 ? 5 : rank === 2 ? 2 : 0
  }

  const { error } = await admin.from("brainstorm_answers").insert({
    pushed_question_id: pushedQuestionId,
    user_id: user.id,
    selected_option_id: selectedOptionId,
    is_correct: isCorrect,
    points_awarded: pointsAwarded,
  })

  if (error) {
    if (error.code === "23505") return { success: false, error: "ALREADY_ANSWERED" }
    return { success: false, error: "INTERNAL" }
  }

  return { success: true, data: { isCorrect, pointsAwarded } }
}

export type LeaderboardEntry = {
  user_id: string
  total_points: number
  correct_answers: number
  user: { name: string; avatar_url: string | null; target_school: string | null }
}

export async function getSessionLeaderboard(sessionId: string): Promise<LeaderboardEntry[]> {
  const admin = createAdminClient()

  const { data } = await admin
    .from("brainstorm_answers")
    .select(`
      user_id, points_awarded, is_correct,
      pushed_question:brainstorm_pushed_questions!inner(session_id),
      user:profiles!brainstorm_answers_user_id_fkey(name, avatar_url, target_school)
    `)
    .eq("brainstorm_pushed_questions.session_id", sessionId)

  if (!data?.length) return []

  const map = new Map<string, LeaderboardEntry>()
  for (const row of data as unknown as Array<{
    user_id: string
    points_awarded: number
    is_correct: boolean
    user: { name: string; avatar_url: string | null; target_school: string | null }
  }>) {
    if (!map.has(row.user_id)) {
      map.set(row.user_id, { user_id: row.user_id, total_points: 0, correct_answers: 0, user: row.user })
    }
    const e = map.get(row.user_id)!
    e.total_points += row.points_awarded
    if (row.is_correct) e.correct_answers++
  }

  return Array.from(map.values()).sort((a, b) => b.total_points - a.total_points)
}

export async function getQuestionAnswers(pushedQuestionId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from("brainstorm_answers")
    .select(`id, is_correct, points_awarded, answered_at, user:profiles!brainstorm_answers_user_id_fkey(name, avatar_url)`)
    .eq("pushed_question_id", pushedQuestionId)
    .order("answered_at", { ascending: true })
  return (data ?? []) as unknown as Array<{
    id: string; is_correct: boolean; points_awarded: number; answered_at: string
    user: { name: string; avatar_url: string | null }
  }>
}

export async function getGeneralSubjects() {
  const admin = createAdminClient()
  const { data: school } = await admin.from("schools").select("id").eq("abbreviation", "GENERAL").single()
  if (!school) return []
  const { data } = await admin.from("questions").select("subject_id, subject:subjects(id, name)").eq("school_id", school.id)
  const map = new Map<string, { id: string; name: string }>()
  for (const row of data ?? []) {
    const s = row.subject as any
    if (s?.id && !map.has(s.id)) map.set(s.id, s)
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
}

// Subjects from ALL schools — used by brainstorm host panel
export async function getBrainstormSubjects() {
  const admin = createAdminClient()
  const { data } = await admin
    .from("questions")
    .select("subject_id, subject:subjects(id, name)")
  const map = new Map<string, { id: string; name: string }>()
  for (const row of data ?? []) {
    const s = row.subject as any
    if (s?.id && !map.has(s.id)) map.set(s.id, s)
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
}

// Questions for a specific subject across ALL schools — for brainstorm host
export async function getBrainstormQuestions(
  subjectId: string,
  search?: string,
  page = 1,
  limit = 15
): Promise<{ questions: GeneralQuestion[]; total: number }> {
  const admin = createAdminClient()
  const from = (page - 1) * limit
  const to = from + limit - 1

  let q = admin
    .from("questions")
    .select(`id, text, year, subject:subjects(id, name), options(id, label, text, is_correct)`, { count: "exact" })
    .eq("subject_id", subjectId)
    .order("year", { ascending: false, nullsFirst: false })
    .range(from, to)

  if (search?.trim()) q = q.ilike("text", `%${search.trim()}%`) as typeof q

  const { data, count } = await q
  return {
    questions: (data ?? []) as unknown as GeneralQuestion[],
    total: count ?? 0,
  }
}

export type MyBrainstormAnswer = {
  id: string
  selected_option_id: string
  is_correct: boolean
  points_awarded: number
}

export async function getUserAnswerForPushedQuestion(
  pushedQuestionId: string
): Promise<MyBrainstormAnswer | null> {
  const user = await getAppUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data } = await admin
    .from("brainstorm_answers")
    .select("id, selected_option_id, is_correct, points_awarded")
    .eq("pushed_question_id", pushedQuestionId)
    .eq("user_id", user.id)
    .single()
  return data ?? null
}
