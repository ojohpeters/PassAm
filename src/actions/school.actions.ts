"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getAppUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function saveExamConfig(formData: FormData) {
  const user = await getAppUser()
  if (!user || user.role !== "ADMIN") return { success: false as const, error: "UNAUTHORIZED" }

  const schoolId = formData.get("school_id") as string
  const totalQuestions = parseInt(formData.get("total_questions") as string, 10)

  if (!schoolId || isNaN(totalQuestions) || totalQuestions < 1 || totalQuestions > 200) {
    return { success: false as const, error: "Invalid input" }
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

  const admin = createAdminClient()

  const { error } = await admin
    .from("school_exam_config")
    .upsert(
      {
        school_id: schoolId,
        total_questions: totalQuestions,
        subject_question_counts: subjectCounts,
      },
      { onConflict: "school_id" }
    )

  if (error) return { success: false as const, error: "Failed to save config" }

  revalidatePath("/admin/schools")
  return { success: true as const }
}
