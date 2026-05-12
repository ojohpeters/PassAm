"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getAppUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import type { ActionResult } from "@/types"

export async function saveExamConfig(formData: FormData) {
  const user = await getAppUser()
  if (!user || user.role !== "ADMIN") return { success: false as const, error: "UNAUTHORIZED" }

  const schoolId = formData.get("school_id") as string
  const totalQuestions = parseInt(formData.get("total_questions") as string, 10)
  const durationMins = parseInt(formData.get("duration_mins") as string, 10)

  if (!schoolId || isNaN(totalQuestions) || totalQuestions < 1 || totalQuestions > 200) {
    return { success: false as const, error: "Invalid input" }
  }
  if (isNaN(durationMins) || durationMins < 1 || durationMins > 360) {
    return { success: false as const, error: "Duration must be 1–360 minutes" }
  }

  // Collect per-subject counts: subject_count_<subjectId> fields
  const subjectCounts: Record<string, number> = {}
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("subject_count_")) {
      const subjectId = key.replace("subject_count_", "")
      const count = parseInt(value as string, 10)
      if (!isNaN(count) && count > 0) {
        subjectCounts[subjectId] = count
      }
    }
  }

  // Collect required subject IDs: required_subject_<subjectId> = "1"
  const requiredSubjectIds: string[] = []
  for (const [key] of formData.entries()) {
    if (key.startsWith("required_subject_")) {
      requiredSubjectIds.push(key.replace("required_subject_", ""))
    }
  }

  const admin = createAdminClient()

  const { error } = await admin
    .from("school_exam_config")
    .upsert(
      {
        school_id: schoolId,
        total_questions: totalQuestions,
        subject_question_counts: subjectCounts,
        duration_mins: durationMins,
        required_subject_ids: requiredSubjectIds,
      },
      { onConflict: "school_id" }
    )

  if (error) return { success: false as const, error: "Failed to save config" }

  revalidatePath("/admin/schools")
  return { success: true as const }
}

export async function submitSchoolRequest(
  schoolName: string,
  message?: string
): Promise<ActionResult<void>> {
  const user = await getAppUser()
  // Allow even unauthenticated-ish calls, but we have auth in this app
  const trimmed = schoolName.trim()
  if (!trimmed) return { success: false, error: "School name required" }

  const admin = createAdminClient()
  const { error } = await admin.from("school_requests").insert({
    user_id: user?.id ?? null,
    user_name: user?.name ?? null,
    user_email: user?.email ?? null,
    school_name: trimmed,
    message: message?.trim() || null,
  })

  if (error) return { success: false, error: "Failed to submit request" }
  return { success: true, data: undefined }
}

export async function getSchoolRequests() {
  const user = await getAppUser()
  if (!user || user.role !== "ADMIN") return null

  const admin = createAdminClient()
  const { data } = await admin
    .from("school_requests")
    .select("id, school_name, message, user_name, user_email, status, created_at")
    .order("created_at", { ascending: false })

  return data ?? []
}

export async function markSchoolRequestNoted(id: string): Promise<ActionResult<void>> {
  const user = await getAppUser()
  if (!user || user.role !== "ADMIN") return { success: false, error: "UNAUTHORIZED" }

  const admin = createAdminClient()
  await admin
    .from("school_requests")
    .update({ status: "NOTED", updated_at: new Date().toISOString() })
    .eq("id", id)

  revalidatePath("/admin/school-requests")
  return { success: true, data: undefined }
}
