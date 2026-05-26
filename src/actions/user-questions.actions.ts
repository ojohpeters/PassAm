"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getAppUser } from "@/lib/auth"
import { revalidatePath } from "next/cache"

type QuestionRow = {
  q_text: string
  opt_a: string
  opt_b: string
  opt_c: string
  opt_d: string
  correct: string
  explanation?: string
  subject_label?: string
}

type ChatMessage = { role: "user" | "assistant"; content: string }

// ─── Question Bank ────────────────────────────────────────────────────────────

export async function getUserQuestions() {
  const user = await getAppUser()
  if (!user) return { success: false as const, error: "UNAUTHORIZED" }
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("user_questions")
    .select("id, q_text, opt_a, opt_b, opt_c, opt_d, correct, explanation, subject_label, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) return { success: false as const, error: (error as { message: string }).message }
  return { success: true as const, data: (data ?? []) as UserQuestion[] }
}

export async function bulkAddUserQuestions(rows: QuestionRow[]) {
  if (!rows.length) return { success: false as const, error: "No questions provided" }
  const user = await getAppUser()
  if (!user) return { success: false as const, error: "UNAUTHORIZED" }
  const supabase = createAdminClient()

  const inserts = rows.map(r => ({
    user_id: user.id,
    q_text: r.q_text.trim(),
    opt_a: r.opt_a.trim(),
    opt_b: r.opt_b.trim(),
    opt_c: r.opt_c.trim(),
    opt_d: r.opt_d.trim(),
    correct: r.correct.trim().toUpperCase(),
    explanation: r.explanation?.trim() || null,
    subject_label: r.subject_label?.trim() || null,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("user_questions").insert(inserts)
  if (error) return { success: false as const, error: (error as { message: string }).message }

  revalidatePath("/my-questions")
  return { success: true as const, count: rows.length }
}

export async function deleteUserQuestion(id: string) {
  const user = await getAppUser()
  if (!user) return { success: false as const, error: "UNAUTHORIZED" }
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("user_questions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return { success: false as const, error: (error as { message: string }).message }
  return { success: true as const }
}

// ─── Groq API Key ─────────────────────────────────────────────────────────────

export async function saveGroqApiKey(key: string) {
  const user = await getAppUser()
  if (!user) return { success: false as const, error: "UNAUTHORIZED" }
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("user_api_keys")
    .upsert({ user_id: user.id, groq_api_key: key.trim() || null, updated_at: new Date().toISOString() })

  if (error) return { success: false as const, error: (error as { message: string }).message }
  return { success: true as const }
}

export async function getGroqApiKey(): Promise<string | null> {
  try {
    const user = await getAppUser()
    if (!user) return null
    const supabase = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("user_api_keys")
      .select("groq_api_key")
      .eq("user_id", user.id)
      .single()
    return (data as { groq_api_key: string | null } | null)?.groq_api_key ?? null
  } catch {
    return null
  }
}

// ─── PrepAI (Groq) ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are PrepAI, an intelligent study assistant built for PrepIQ by Ojochegbe. PrepIQ helps Nigerian students prepare for JAMB, WAEC, NECO, and Post-UTME examinations.

You specialise in all Nigerian exam subjects: Mathematics, English Language, Physics, Chemistry, Biology, Economics, Government, Literature in English, Geography, Agricultural Science, Commerce, Accounting, and more.

You can:
1. Explain any concept step-by-step in simple, clear language suited to the Nigerian curriculum
2. Quiz students and give detailed breakdowns of answers
3. Generate practice questions in CSV format on request

When generating CSV questions, ALWAYS wrap them in a \`\`\`csv code block. Use exactly 8 comma-separated columns per line:
question text, option A, option B, option C, option D, correct letter (A/B/C/D), explanation, subject label

Example:
\`\`\`csv
What is the powerhouse of the cell?,Nucleus,Mitochondria,Ribosome,Golgi body,B,The mitochondria generates ATP through cellular respiration.,Biology
\`\`\`

Rules for CSV:
- No header row
- Use double quotes around fields that contain commas
- correct must be exactly A, B, C, or D
- explanation should be concise (1-2 sentences)
- subject label should be a single word or short phrase

Be encouraging, patient, and educational. Always root for the student's success.`

export async function chatWithGroqAI(messages: ChatMessage[], apiKey: string) {
  if (!apiKey.trim()) return { success: false as const, error: "no_key" as const }

  const user = await getAppUser()
  if (!user) return { success: false as const, error: "no_key" as const }

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        max_tokens: 2048,
        temperature: 0.7,
      }),
    })

    if (res.status === 401) return { success: false as const, error: "expired" as const }
    if (res.status === 429) return { success: false as const, error: "rate_limit" as const }
    if (!res.ok) return { success: false as const, error: "api_error" as const }

    const data = await res.json() as { choices?: { message?: { content?: string } }[] }
    const content = data.choices?.[0]?.message?.content ?? ""
    return { success: true as const, content }
  } catch {
    return { success: false as const, error: "network" as const }
  }
}

// ─── Shared Types ─────────────────────────────────────────────────────────────

export type UserQuestion = {
  id: string
  q_text: string
  opt_a: string
  opt_b: string
  opt_c: string
  opt_d: string
  correct: string
  explanation: string | null
  subject_label: string | null
  created_at: string
}
