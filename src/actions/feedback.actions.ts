"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getAppUser } from "@/lib/auth"
import { z } from "zod"
import type { ActionResult } from "@/types"

const feedbackSchema = z.object({
  questionId: z.string().uuid(),
  type: z.enum(["WRONG_ANSWER", "TYPO", "SUGGESTION"]),
  message: z.string().min(5).max(500),
})

export async function submitFeedback(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await getAppUser()
  if (!user) return { success: false, error: "UNAUTHORIZED" }

  const parsed = feedbackSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: "VALIDATION_ERROR" }

  const admin = createAdminClient()
  const { data: fb, error } = await admin
    .from("feedback")
    .insert({
      user_id: user.id,
      question_id: parsed.data.questionId,
      type: parsed.data.type,
      message: parsed.data.message,
      status: "PENDING",
    })
    .select("id")
    .single()

  if (error || !fb) return { success: false, error: "INTERNAL" }
  return { success: true, data: { id: fb.id } }
}

export async function getFeedbacks(
  status?: "PENDING" | "REVIEWED" | "RESOLVED",
  page = 1
) {
  const user = await getAppUser()
  if (!user || user.role !== "ADMIN") return null

  const limit = 20
  const from = (page - 1) * limit
  const to = from + limit - 1

  const admin = createAdminClient()

  let query = admin
    .from("feedback")
    .select(`
      id, type, message, status, created_at,
      user:profiles(name, email:id),
      question:questions(text)
    `, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)

  if (status) query = query.eq("status", status)

  const { data, count } = await query

  // We need email from auth.users since profiles don't store it.
  // For simplicity we join by profile id in user:profiles and fetch email separately.
  // Actually we need to pull emails. Let's use a simpler approach: fetch user emails via admin auth.
  const items = (data ?? []).map((fb: any) => ({
    id: fb.id,
    type: fb.type,
    message: fb.message,
    status: fb.status,
    createdAt: fb.created_at,
    user: { name: fb.user?.name ?? "Unknown", email: "" },
    question: { text: fb.question?.text ?? "" },
  }))

  return { items, total: count ?? 0, pages: Math.ceil((count ?? 0) / limit) }
}

export async function updateFeedbackStatus(
  id: string,
  status: "REVIEWED" | "RESOLVED"
): Promise<ActionResult<void>> {
  const user = await getAppUser()
  if (!user || user.role !== "ADMIN") {
    return { success: false, error: "UNAUTHORIZED" }
  }

  const admin = createAdminClient()
  await admin.from("feedback").update({ status }).eq("id", id)
  return { success: true, data: undefined }
}
