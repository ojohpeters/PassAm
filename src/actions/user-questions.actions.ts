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
    .select("id, q_text, opt_a, opt_b, opt_c, opt_d, correct, explanation, subject_label, created_at, is_public, moderation_status, moderation_note")
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

// ─── API Keys ─────────────────────────────────────────────────────────────────

type ApiKeyRow = {
  groq_api_key: string | null
  deepseek_api_key: string | null
  gemini_api_key: string | null
  chat_history_days: number | null
}

async function upsertKey(userId: string, patch: Partial<ApiKeyRow>) {
  const supabase = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("user_api_keys")
    .upsert({ user_id: userId, ...patch, updated_at: new Date().toISOString() })
  return error ? (error as { message: string }).message : null
}

export async function saveGroqApiKey(key: string) {
  const user = await getAppUser()
  if (!user) return { success: false as const, error: "UNAUTHORIZED" }
  const err = await upsertKey(user.id, { groq_api_key: key.trim() || null })
  if (err) return { success: false as const, error: err }
  return { success: true as const }
}

export async function saveDeepseekApiKey(key: string) {
  const user = await getAppUser()
  if (!user) return { success: false as const, error: "UNAUTHORIZED" }
  const err = await upsertKey(user.id, { deepseek_api_key: key.trim() || null })
  if (err) return { success: false as const, error: err }
  return { success: true as const }
}

export async function saveGeminiApiKey(key: string) {
  const user = await getAppUser()
  if (!user) return { success: false as const, error: "UNAUTHORIZED" }
  const err = await upsertKey(user.id, { gemini_api_key: key.trim() || null })
  if (err) return { success: false as const, error: err }
  return { success: true as const }
}

export async function saveChatHistoryDays(days: number | null) {
  const user = await getAppUser()
  if (!user) return { success: false as const, error: "UNAUTHORIZED" }
  const err = await upsertKey(user.id, { chat_history_days: days })
  if (err) return { success: false as const, error: err }
  return { success: true as const }
}

export async function getApiKeys(): Promise<{ groqKey: string | null; deepseekKey: string | null; geminiKey: string | null; chatHistoryDays: number | null }> {
  try {
    const user = await getAppUser()
    if (!user) return { groqKey: null, deepseekKey: null, geminiKey: null, chatHistoryDays: null }
    const supabase = createAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from("user_api_keys")
      .select("groq_api_key, deepseek_api_key, gemini_api_key, chat_history_days")
      .eq("user_id", user.id)
      .single()
    const row = data as ApiKeyRow | null
    return {
      groqKey: row?.groq_api_key ?? null,
      deepseekKey: row?.deepseek_api_key ?? null,
      geminiKey: row?.gemini_api_key ?? null,
      chatHistoryDays: row?.chat_history_days ?? null,
    }
  } catch {
    return { groqKey: null, deepseekKey: null, geminiKey: null, chatHistoryDays: null }
  }
}

// ─── PrepAI: DeepSeek (primary) + Groq (backup) ──────────────────────────────

const SYSTEM_PROMPT = `You are PrepAI, an intelligent study assistant built for PrepIQ by Ojochegbe. PrepIQ helps Nigerian students prepare for JAMB, WAEC, NECO, and Post-UTME examinations.

You specialise in all Nigerian exam subjects: Mathematics, English Language, Physics, Chemistry, Biology, Economics, Government, Literature in English, Geography, Agricultural Science, Commerce, Accounting, and more.

You can:
1. Explain any concept step-by-step in simple, clear language suited to the Nigerian curriculum
2. Quiz students and give detailed breakdowns of answers
3. Generate practice questions in CSV format on request
4. Analyse attached documents (past question papers, study notes) and extract questions from them

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

// Gemini native API — works with free AI Studio keys, no OpenAI-compat layer needed
async function callGemini(messages: ChatMessage[], apiKey: string, pdfContext?: string): Promise<{ ok: boolean; content?: string; errorCode?: string; detail?: string }> {
  const system = pdfContext
    ? `${SYSTEM_PROMPT}\n\n---\nATTACHED DOCUMENT:\n${pdfContext.slice(0, 24000)}\n---`
    : SYSTEM_PROMPT

  // Gemini uses "model" instead of "assistant" for the AI role
  const contents = messages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }))

  const res = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
    {
      method: "POST",
      headers: { "X-goog-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents,
        generationConfig: { maxOutputTokens: 2048, temperature: 0.7 },
      }),
    }
  )

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    console.error(`[Gemini] HTTP ${res.status}:`, body)
    if (res.status === 401 || res.status === 403) return { ok: false, errorCode: "expired_gemini" }
    if (res.status === 429) return { ok: false, errorCode: "rate_limit" }
    return { ok: false, errorCode: res.status === 429 ? "rate_limit" : "api_error", detail: `Gemini HTTP ${res.status}: ${body.slice(0, 300)}` }
  }

  const data = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? ""
  return { ok: true, content }
}

async function callDeepSeek(messages: ChatMessage[], apiKey: string, pdfContext?: string): Promise<{ ok: boolean; content?: string; errorCode?: string }> {
  const system = pdfContext
    ? `${SYSTEM_PROMPT}\n\n---\nATTACHED DOCUMENT (use this as context for the student's questions):\n${pdfContext.slice(0, 24000)}\n---`
    : SYSTEM_PROMPT

  const res = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "deepseek-v4-flash",
      messages: [{ role: "system", content: system }, ...messages],
      max_tokens: 2048,
    }),
  })

  if (res.status === 401 || res.status === 403) return { ok: false, errorCode: "expired_deepseek" }
  if (res.status === 402) return { ok: false, errorCode: "no_balance" }
  if (res.status === 429) return { ok: false, errorCode: "rate_limit" }
  if (!res.ok) return { ok: false, errorCode: "api_error" }

  const data = await res.json() as { choices?: { message?: { content?: string } }[] }
  return { ok: true, content: data.choices?.[0]?.message?.content ?? "" }
}

async function callGroq(messages: ChatMessage[], apiKey: string, pdfContext?: string): Promise<{ ok: boolean; content?: string; errorCode?: string }> {
  const system = pdfContext
    ? `${SYSTEM_PROMPT}\n\n---\nATTACHED DOCUMENT:\n${pdfContext.slice(0, 24000)}\n---`
    : SYSTEM_PROMPT

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: system }, ...messages],
      max_tokens: 2048,
      temperature: 0.7,
    }),
  })

  if (res.status === 401) return { ok: false, errorCode: "expired_groq" }
  if (res.status === 429) return { ok: false, errorCode: "rate_limit" }
  if (!res.ok) return { ok: false, errorCode: "api_error" }

  const data = await res.json() as { choices?: { message?: { content?: string } }[] }
  return { ok: true, content: data.choices?.[0]?.message?.content ?? "" }
}

// Provider priority: Gemini (free) → Groq (free) → DeepSeek (paid)
export async function chatWithAI(
  messages: ChatMessage[],
  geminiKey: string | null,
  groqKey: string | null,
  deepseekKey: string | null,
  pdfContext?: string,
) {
  const user = await getAppUser()
  if (!user) return { success: false as const, error: "no_key" as const }

  if (!geminiKey?.trim() && !groqKey?.trim() && !deepseekKey?.trim()) {
    return { success: false as const, error: "no_key" as const }
  }

  try {
    // 1. Gemini (free primary) — fall through to Groq on any failure
    if (geminiKey?.trim()) {
      const gm = await callGemini(messages, geminiKey.trim(), pdfContext)
      if (gm.ok) return { success: true as const, content: gm.content!, provider: "gemini" as const }
      console.error("[PrepAI] Gemini failed:", gm.errorCode, (gm as { detail?: string }).detail ?? "")
      // Always fall through — Groq will pick up even on rate limit
    }

    // 2. Groq (free backup)
    if (groqKey?.trim()) {
      const gr = await callGroq(messages, groqKey.trim(), pdfContext)
      if (gr.ok) return { success: true as const, content: gr.content!, provider: "groq" as const }
      if (gr.errorCode === "rate_limit") return { success: false as const, error: "rate_limit" as const }
      // expired/error → fall through to DeepSeek
    }

    // 3. DeepSeek (paid, optional)
    if (deepseekKey?.trim()) {
      const ds = await callDeepSeek(messages, deepseekKey.trim(), pdfContext)
      if (ds.ok) return { success: true as const, content: ds.content!, provider: "deepseek" as const }
      if (ds.errorCode === "no_balance") return { success: false as const, error: "no_balance" as const }
      if (ds.errorCode === "rate_limit") return { success: false as const, error: "rate_limit" as const }
      return { success: false as const, error: "expired_deepseek" as const }
    }

    // All providers failed — report Gemini failure if that's the only one we tried
    return { success: false as const, error: "expired_gemini" as const }
  } catch {
    return { success: false as const, error: "network" as const }
  }
}

// ─── Chat History ─────────────────────────────────────────────────────────────

export type StoredMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  provider: string | null
  created_at: string
}

export async function loadChatHistory(): Promise<{ success: true; messages: StoredMessage[] } | { success: false; error: string }> {
  try {
    const user = await getAppUser()
    if (!user) return { success: false, error: "UNAUTHORIZED" }
    const supabase = createAdminClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: keyRow } = await (supabase as any)
      .from("user_api_keys")
      .select("chat_history_days")
      .eq("user_id", user.id)
      .single()

    const historyDays = (keyRow as { chat_history_days: number | null } | null)?.chat_history_days
    if (!historyDays) return { success: true, messages: [] }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("ai_chat_messages")
      .select("id, role, content, provider, created_at")
      .eq("user_id", user.id)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: true })

    if (error) return { success: false, error: (error as { message: string }).message }
    return { success: true, messages: (data ?? []) as StoredMessage[] }
  } catch {
    return { success: true, messages: [] }
  }
}

export async function saveChatMessages(
  msgs: Array<{ role: "user" | "assistant"; content: string; provider?: string }>,
  historyDays: number,
) {
  const user = await getAppUser()
  if (!user) return { success: false as const, error: "UNAUTHORIZED" }
  const supabase = createAdminClient()

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + historyDays)

  const inserts = msgs.map(m => ({
    user_id: user.id,
    role: m.role,
    content: m.content,
    provider: m.provider ?? null,
    expires_at: expiresAt.toISOString(),
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("ai_chat_messages").insert(inserts)
  if (error) return { success: false as const, error: (error as { message: string }).message }
  return { success: true as const }
}

export async function clearChatHistory() {
  const user = await getAppUser()
  if (!user) return { success: false as const, error: "UNAUTHORIZED" }
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("ai_chat_messages")
    .delete()
    .eq("user_id", user.id)

  if (error) return { success: false as const, error: (error as { message: string }).message }
  return { success: true as const }
}

// ─── Community Questions ──────────────────────────────────────────────────────

const MAX_PENDING = 10
const AUTO_FLAG_THRESHOLD = 3

export async function submitForCommunity(questionId: string) {
  const user = await getAppUser()
  if (!user) return { success: false as const, error: "UNAUTHORIZED" }
  const supabase = createAdminClient()

  // Rate-limit: no more than MAX_PENDING in review at once
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (supabase as any)
    .from("user_questions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("moderation_status", "pending")

  if ((count ?? 0) >= MAX_PENDING) {
    return { success: false as const, error: "MAX_PENDING" }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("user_questions")
    .update({ is_public: true, moderation_status: "pending", moderation_note: null })
    .eq("id", questionId)
    .eq("user_id", user.id)

  if (error) return { success: false as const, error: (error as { message: string }).message }
  return { success: true as const }
}

export async function withdrawFromCommunity(questionId: string) {
  const user = await getAppUser()
  if (!user) return { success: false as const, error: "UNAUTHORIZED" }
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("user_questions")
    .update({ is_public: false, moderation_status: "private", moderation_note: null })
    .eq("id", questionId)
    .eq("user_id", user.id)

  if (error) return { success: false as const, error: (error as { message: string }).message }
  return { success: true as const }
}

export type CommunityQuestion = {
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

export async function getCommunityQuestions(opts?: {
  subject?: string
  search?: string
  page?: number
}): Promise<{ success: true; data: CommunityQuestion[]; total: number; subjects: string[] } | { success: false; error: string }> {
  const user = await getAppUser()
  if (!user) return { success: false, error: "UNAUTHORIZED" }
  const supabase = createAdminClient()

  const page = opts?.page ?? 1
  const limit = 24
  const offset = (page - 1) * limit

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from("user_questions")
    .select("id, q_text, opt_a, opt_b, opt_c, opt_d, correct, explanation, subject_label, created_at", { count: "exact" })
    .eq("is_public", true)
    .eq("moderation_status", "approved")

  if (opts?.subject) query = query.eq("subject_label", opts.subject)
  if (opts?.search) query = query.ilike("q_text", `%${opts.search}%`)

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) return { success: false, error: (error as { message: string }).message }

  // Fetch distinct subjects for filter pills
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: subjectRows } = await (supabase as any)
    .from("user_questions")
    .select("subject_label")
    .eq("is_public", true)
    .eq("moderation_status", "approved")
    .not("subject_label", "is", null)

  const subjects: string[] = Array.from(
    new Set((subjectRows ?? []).map((r: { subject_label: string }) => r.subject_label).filter(Boolean))
  ).sort() as string[]

  return { success: true, data: (data ?? []) as CommunityQuestion[], total: count ?? 0, subjects }
}

export async function reportCommunityQuestion(questionId: string, reason: string) {
  const user = await getAppUser()
  if (!user) return { success: false as const, error: "UNAUTHORIZED" }
  const supabase = createAdminClient()

  const trimmedReason = reason.trim().slice(0, 500)
  if (trimmedReason.length < 5) return { success: false as const, error: "REASON_TOO_SHORT" }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("question_reports")
    .insert({ question_id: questionId, reporter_id: user.id, reason: trimmedReason })

  if (error) {
    if ((error as { code?: string }).code === "23505") return { success: false as const, error: "ALREADY_REPORTED" }
    return { success: false as const, error: (error as { message: string }).message }
  }

  // Auto-flag if reports hit threshold
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count } = await (supabase as any)
    .from("question_reports")
    .select("*", { count: "exact", head: true })
    .eq("question_id", questionId)

  if ((count ?? 0) >= AUTO_FLAG_THRESHOLD) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("user_questions")
      .update({ moderation_status: "flagged" })
      .eq("id", questionId)
      .eq("is_public", true)
      .eq("moderation_status", "approved")
  }

  return { success: true as const }
}

// ─── Admin: Moderation Queue ──────────────────────────────────────────────────

export type ModerationItem = {
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
  moderation_status: string
  user_id: string
  report_count: number
}

export async function getModerationQueue(): Promise<{ success: true; data: ModerationItem[] } | { success: false; error: string }> {
  const user = await getAppUser()
  if (!user || user.role !== "ADMIN") return { success: false, error: "UNAUTHORIZED" }
  const supabase = createAdminClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("user_questions")
    .select("id, q_text, opt_a, opt_b, opt_c, opt_d, correct, explanation, subject_label, created_at, moderation_status, user_id")
    .in("moderation_status", ["pending", "flagged"])
    .order("moderation_status", { ascending: false }) // flagged first
    .order("created_at", { ascending: true })

  if (error) return { success: false, error: (error as { message: string }).message }

  // Enrich with report counts
  const items = await Promise.all((data ?? []).map(async (row: ModerationItem) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { count } = await (supabase as any)
      .from("question_reports")
      .select("*", { count: "exact", head: true })
      .eq("question_id", row.id)
    return { ...row, report_count: count ?? 0 }
  }))

  return { success: true, data: items as ModerationItem[] }
}

export async function moderateQuestion(questionId: string, action: "approve" | "reject", note?: string) {
  const user = await getAppUser()
  if (!user || user.role !== "ADMIN") return { success: false as const, error: "UNAUTHORIZED" }
  const supabase = createAdminClient()

  const update = action === "approve"
    ? { moderation_status: "approved", moderation_note: null }
    : { moderation_status: "rejected", is_public: false, moderation_note: note?.trim() || null }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("user_questions")
    .update(update)
    .eq("id", questionId)

  if (error) return { success: false as const, error: (error as { message: string }).message }
  return { success: true as const }
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
  is_public: boolean
  moderation_status: "private" | "pending" | "approved" | "rejected" | "flagged"
  moderation_note: string | null
}
