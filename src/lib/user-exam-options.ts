// Sentinel option UUIDs for personal/community questions in exams.
// These are valid UUID strings used as stable option identifiers since
// user questions don't have rows in the `options` table.
export const USER_OPTION_IDS = {
  A: "00000000-0000-0000-0000-000000000001",
  B: "00000000-0000-0000-0000-000000000002",
  C: "00000000-0000-0000-0000-000000000003",
  D: "00000000-0000-0000-0000-000000000004",
} as const

const REVERSE_MAP: Record<string, "A" | "B" | "C" | "D"> = {
  "00000000-0000-0000-0000-000000000001": "A",
  "00000000-0000-0000-0000-000000000002": "B",
  "00000000-0000-0000-0000-000000000003": "C",
  "00000000-0000-0000-0000-000000000004": "D",
}

export function labelFromUserOptionId(id: string | null): "A" | "B" | "C" | "D" | null {
  if (!id) return null
  return REVERSE_MAP[id] ?? null
}

// Used as subject_id in QuestionWithOptions when no subject match is found
export const PERSONAL_SUBJECT_ID = "00000000-0000-0000-0000-000000000000"
