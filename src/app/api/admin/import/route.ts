import { type NextRequest, NextResponse } from "next/server"
import { getAppUser } from "@/lib/auth"
import { parseImportedQuestions } from "@/actions/admin.actions"
import Papa from "papaparse"

// CSV columns: text, explanation, year, schoolId, subjectId, optA, optB, optC, optD, correct (A|B|C|D)
export async function POST(req: NextRequest) {
  const user = await getAppUser()
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })

  const text = await file.text()
  const { data } = Papa.parse(text, { header: true, skipEmptyLines: true })

  const rows = (data as Record<string, string>[]).map((row) => ({
    text: row.text,
    explanation: row.explanation || undefined,
    year: row.year ? Number(row.year) : undefined,
    schoolId: row.schoolId,
    subjectId: row.subjectId,
    options: [
      { label: "A", text: row.optA, isCorrect: row.correct === "A" },
      { label: "B", text: row.optB, isCorrect: row.correct === "B" },
      { label: "C", text: row.optC, isCorrect: row.correct === "C" },
      { label: "D", text: row.optD, isCorrect: row.correct === "D" },
    ],
  }))

  const result = await parseImportedQuestions(rows)
  return NextResponse.json(result)
}
