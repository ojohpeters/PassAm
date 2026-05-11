import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { AppUser } from "@/types/database"

export async function getAppUser(): Promise<AppUser | null> {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from("profiles")
    .select("name, role, subscription_status, is_banned")
    .eq("id", user.id)
    .single()

  if (!profile) return null

  return {
    id: user.id,
    email: user.email!,
    name: profile.name,
    role: profile.role,
    subscriptionStatus: profile.subscription_status,
    isBanned: profile.is_banned ?? false,
  }
}
