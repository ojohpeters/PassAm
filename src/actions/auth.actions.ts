"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { registerSchema } from "@/lib/validations/user"
import { redirect } from "next/navigation"
import type { ActionResult } from "@/types"

export async function registerUser(
  formData: FormData
): Promise<ActionResult<{ email: string }>> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  })
  if (!parsed.success) return { success: false, error: "VALIDATION_ERROR" }

  const { name, email, password } = parsed.data
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  })

  if (error || !data.user) return { success: false, error: "VALIDATION_ERROR" }

  // Belt-and-suspenders: upsert profile in case trigger hasn't fired yet
  const admin = createAdminClient()
  await admin.from("profiles").upsert({
    id: data.user.id,
    name,
    role: "STUDENT",
    subscription_status: "FREE",
  })

  redirect("/dashboard")
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
