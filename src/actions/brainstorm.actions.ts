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
