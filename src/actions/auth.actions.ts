"use server"

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { registerSchema } from "@/lib/validations/user"
import { redirect } from "next/navigation"

export async function loginUser(
  formData: FormData
): Promise<{ error: string }> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  })
  if (error) return { error: "Invalid email or password." }

  // Route admins to the admin panel, students to dashboard (or their callbackUrl)
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
    if (profile?.role === "ADMIN") redirect("/admin")
  }

  const callbackUrl = (formData.get("callbackUrl") as string) || "/dashboard"
  redirect(callbackUrl)
}

export async function registerUser(
  formData: FormData
): Promise<{ error: string }> {
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

  redirect("/dashboard")
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/login")
}

export async function requestPasswordReset(
  formData: FormData
): Promise<{ error?: string; success?: boolean }> {
  const email = (formData.get("email") as string)?.trim()
  if (!email) return { error: "Email is required." }

  const supabase = await createClient()
  const siteUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  })

  if (error) return { error: "Could not send reset email. Please try again." }
  return { success: true }
}

export async function updatePassword(
  formData: FormData
): Promise<{ error?: string }> {
  const password = formData.get("password") as string
  if (!password || password.length < 6) return { error: "Password must be at least 6 characters." }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: "Could not update password. Your reset link may have expired." }
  redirect("/dashboard")
}
