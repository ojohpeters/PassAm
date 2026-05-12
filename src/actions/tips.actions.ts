"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getAppUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import type { ActionResult } from "@/types"
import type { StudyTip } from "@/types/database"

async function requireAdmin() {
  const user = await getAppUser()
  if (!user || user.role !== "ADMIN") throw new Error("UNAUTHORIZED")
}

// ── Student ───────────────────────────────────────────────────────────────────

export async function getPublishedTips(category?: string): Promise<StudyTip[]> {
  const admin = createAdminClient()
  let query = admin
    .from("study_tips")
    .select("*")
    .eq("is_published", true)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })

  if (category && category !== "All") {
    query = query.eq("category", category)
  }

  const { data } = await query
  return data ?? []
}

export async function getLatestTips(limit = 3): Promise<StudyTip[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from("study_tips")
    .select("*")
    .eq("is_published", true)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit)
  return data ?? []
}

export async function getTipCategories(): Promise<string[]> {
  const admin = createAdminClient()
  const { data } = await admin
    .from("study_tips")
    .select("category")
    .eq("is_published", true)
  const unique = Array.from(new Set((data ?? []).map((r) => r.category))).sort()
  return unique
}

// ── Admin ─────────────────────────────────────────────────────────────────────

export async function getAllTips(): Promise<StudyTip[] | null> {
  try { await requireAdmin() } catch { return null }
  const admin = createAdminClient()
  const { data } = await admin
    .from("study_tips")
    .select("*")
    .order("created_at", { ascending: false })
  return data ?? []
}

export async function createTip(input: {
  title: string
  content: string
  image_url?: string
  category: string
  type: string
}): Promise<ActionResult<{ id: string }>> {
  try { await requireAdmin() } catch { return { success: false, error: "UNAUTHORIZED" } }

  const { title, content, image_url, category, type } = input
  if (!title.trim() || !content.trim()) return { success: false, error: "Title and content required" }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from("study_tips")
    .insert({
      title: title.trim(),
      content: content.trim(),
      image_url: image_url?.trim() || null,
      category: category.trim() || "General",
      type: type || "TIP",
      is_published: false,
      pinned: false,
    })
    .select("id")
    .single()

  if (error || !data) return { success: false, error: "Failed to create tip" }
  revalidatePath("/admin/tips")
  revalidatePath("/tips")
  return { success: true, data: { id: data.id } }
}

export async function updateTip(
  id: string,
  input: Partial<{ title: string; content: string; image_url: string; category: string; type: string }>
): Promise<ActionResult<void>> {
  try { await requireAdmin() } catch { return { success: false, error: "UNAUTHORIZED" } }

  const admin = createAdminClient()
  const { error } = await admin
    .from("study_tips")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)

  if (error) return { success: false, error: "Failed to update tip" }
  revalidatePath("/admin/tips")
  revalidatePath("/tips")
  return { success: true, data: undefined }
}

export async function toggleTipPublished(id: string, current: boolean): Promise<ActionResult<void>> {
  try { await requireAdmin() } catch { return { success: false, error: "UNAUTHORIZED" } }

  const admin = createAdminClient()
  await admin
    .from("study_tips")
    .update({ is_published: !current, updated_at: new Date().toISOString() })
    .eq("id", id)

  revalidatePath("/admin/tips")
  revalidatePath("/tips")
  return { success: true, data: undefined }
}

export async function toggleTipPinned(id: string, current: boolean): Promise<ActionResult<void>> {
  try { await requireAdmin() } catch { return { success: false, error: "UNAUTHORIZED" } }

  const admin = createAdminClient()
  await admin
    .from("study_tips")
    .update({ pinned: !current, updated_at: new Date().toISOString() })
    .eq("id", id)

  revalidatePath("/admin/tips")
  revalidatePath("/tips")
  return { success: true, data: undefined }
}

export async function deleteTip(id: string): Promise<ActionResult<void>> {
  try { await requireAdmin() } catch { return { success: false, error: "UNAUTHORIZED" } }

  const admin = createAdminClient()
  await admin.from("study_tips").delete().eq("id", id)
  revalidatePath("/admin/tips")
  revalidatePath("/tips")
  return { success: true, data: undefined }
}
