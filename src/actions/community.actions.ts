"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getAppUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import type { ActionResult } from "@/types"

export async function updateWhatsappSettings(
  whatsappNumber: string,
  showWhatsapp: boolean
): Promise<ActionResult<void>> {
  const user = await getAppUser()
  if (!user) return { success: false, error: "UNAUTHORIZED" }

  const admin = createAdminClient()
  const { error } = await admin
    .from("profiles")
    .update({ whatsapp_number: whatsappNumber.trim() || null, show_whatsapp: showWhatsapp })
    .eq("id", user.id)

  if (error) return { success: false, error: "INTERNAL" }
  revalidatePath("/profile")
  revalidatePath("/community")
  return { success: true, data: undefined }
}

export type CommunityMember = {
  id: string
  name: string
  whatsapp_number: string
  target_school: string | null
  avatar_url: string | null
  created_at: string
  school: { id: string; name: string; abbreviation: string } | null
}

export async function getCommunityMembers(): Promise<CommunityMember[]> {
  const admin = createAdminClient()

  const { data: members } = await admin
    .from("profiles")
    .select("id, name, whatsapp_number, target_school, avatar_url, created_at")
    .eq("show_whatsapp", true)
    .eq("role", "STUDENT")
    .not("whatsapp_number", "is", null)
    .order("name")

  if (!members?.length) return []

  // Resolve target_school names to school objects
  const { data: schools } = await admin
    .from("schools")
    .select("id, name, abbreviation")
    .neq("abbreviation", "GENERAL")

  const schoolByName = new Map(
    (schools ?? []).map((s) => [s.name.toLowerCase(), s])
  )

  return members.map((m) => ({
    ...m,
    whatsapp_number: m.whatsapp_number!,
    school: m.target_school
      ? (schoolByName.get(m.target_school.toLowerCase()) ?? null)
      : null,
  }))
}
