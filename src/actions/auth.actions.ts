"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { registerSchema } from "@/lib/validations/user"
import { redirect } from "next/navigation"

export async function loginUser(
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  })
  if (error) return { error: "Invalid email or password." }
  return { success: true }
}

export async function registerUser(
  formData: FormData
): Promise<{ error: string } | { success: true }> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  })
  if (!parsed.success) return { error: "Please check your details and try again." }

  const { name, email, password } = parsed.data
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  })

  if (error) {
    return {
      error: error.message.includes("already registered")
        ? "An account with this email already exists."
        : "Registration failed. Please try again.",
    }
  }
  if (!data.user) return { error: "Registration failed. Please try again." }

  // Belt-and-suspenders: upsert profile in case trigger hasn't fired yet
  const admin = createAdminClient()
  await admin.from("profiles").upsert({
    id: data.user.id,
    name,
    role: "STUDENT",
    subscription_status: "FREE",
  })

  return { success: true }
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}
