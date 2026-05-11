"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getAppUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function updateProfile(formData: FormData) {
  const user = await getAppUser()
  if (!user) return { success: false as const, error: "UNAUTHORIZED" }

  const name = (formData.get("name") as string)?.trim()
  const bio = (formData.get("bio") as string)?.trim() || null
  const targetSchool = (formData.get("target_school") as string)?.trim() || null

  if (!name || name.length < 2) return { success: false as const, error: "Name must be at least 2 characters" }
  if (bio && bio.length > 160) return { success: false as const, error: "Bio must be 160 characters or less" }

  const admin = createAdminClient()
  const { error } = await admin
    .from("profiles")
    .update({ name, bio, target_school: targetSchool })
    .eq("id", user.id)

  if (error) return { success: false as const, error: "Failed to save changes" }

  revalidatePath("/profile")
  return { success: true as const }
}

export async function uploadAvatar(formData: FormData) {
  const user = await getAppUser()
  if (!user) return { success: false as const, error: "UNAUTHORIZED" }

  const file = formData.get("avatar") as File
  if (!file || file.size === 0) return { success: false as const, error: "No file provided" }

  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false as const, error: "Only JPEG, PNG, or WebP images allowed" }
  }
  if (file.size > 2 * 1024 * 1024) {
    return { success: false as const, error: "Image must be under 2 MB" }
  }

  const ext = file.type === "image/jpeg" ? "jpg" : file.type.split("/")[1]
  const path = `${user.id}/${Date.now()}.${ext}`

  const admin = createAdminClient()
  const bytes = await file.arrayBuffer()

  const { error: uploadError } = await admin.storage
    .from("avatars")
    .upload(path, bytes, { contentType: file.type, upsert: false })

  if (uploadError) return { success: false as const, error: "Upload failed — try again" }

  const { data: { publicUrl } } = admin.storage.from("avatars").getPublicUrl(path)

  const { error: updateError } = await admin
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id)

  if (updateError) return { success: false as const, error: "Saved photo but failed to link it — try again" }

  revalidatePath("/profile")
  return { success: true as const, url: publicUrl }
}
