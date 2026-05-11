"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getAppUser } from "@/lib/auth"
import type { ActionResult, LeaderboardEntry } from "@/types"

export async function getLeaderboard(
  schoolId?: string,
  limit = 20
): Promise<ActionResult<LeaderboardEntry[]>> {
  const user = await getAppUser()
  if (!user) return { success: false, error: "UNAUTHORIZED" }

  const admin = createAdminClient()
  const { data, error } = await admin.rpc("get_weekly_leaderboard", {
    p_school_id: schoolId ?? null,
    p_limit: limit,
  })

  if (error) return { success: false, error: "INTERNAL" }

  return {
    success: true,
    data: (data ?? []).map((r: any, i: number) => ({
      rank: i + 1,
      userId: r.user_id,
      name: r.name,
      totalScore: Number(r.total_score),
      attempts: Number(r.attempts),
      isCurrentUser: r.user_id === user.id,
    })),
  }
}

export async function getStudentRank(schoolId?: string) {
  const user = await getAppUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data } = await admin.rpc("get_weekly_leaderboard", {
    p_school_id: schoolId ?? null,
    p_limit: 1000,
  })

  if (!data) return null

  const entries = data as { user_id: string; total_score: number }[]
  const myEntry = entries.find((e) => e.user_id === user.id)
  const myTotal = myEntry ? Number(myEntry.total_score) : 0
  const rank = entries.filter((e) => Number(e.total_score) > myTotal).length + 1

  return { rank, totalScore: myTotal }
}
