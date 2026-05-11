"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getAppUser } from "@/lib/auth"
import { todayWAT } from "@/lib/utils"
import type { Database } from "@/types/database"

type NotificationType = Database["public"]["Tables"]["notifications"]["Row"]["type"]

export async function updateStreak(userId: string): Promise<void> {
  const today = todayWAT()
  const d = new Date(today + "T00:00:00Z")
  d.setDate(d.getDate() - 1)
  const yesterday = d.toISOString().split("T")[0]

  const admin = createAdminClient()
  const { data: streak } = await admin
    .from("streaks")
    .select("*")
    .eq("user_id", userId)
    .single()

  if (!streak) {
    await admin.from("streaks").insert({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_activity_date: today,
    })
    return
  }

  if (streak.last_activity_date === today) return

  const isConsecutive = streak.last_activity_date === yesterday
  const newCurrent = isConsecutive ? streak.current_streak + 1 : 1

  await admin.from("streaks").update({
    current_streak: newCurrent,
    longest_streak: Math.max(newCurrent, streak.longest_streak),
    last_activity_date: today,
  }).eq("user_id", userId)
}

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string
): Promise<void> {
  const admin = createAdminClient()
  await admin.from("notifications").insert({ user_id: userId, type, title, body })
}

export async function getNotifications() {
  const user = await getAppUser()
  if (!user) return []

  const admin = createAdminClient()
  const { data } = await admin
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("is_read", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(20)

  return data ?? []
}

export async function markAllRead() {
  const user = await getAppUser()
  if (!user) return

  const admin = createAdminClient()
  await admin
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false)
}
