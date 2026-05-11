"use client"

import { startExam } from "@/actions/exam.actions"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

type Props = { schoolId: string; schoolSlug: string; disabled: boolean }

export function StartExamButton({ schoolId, schoolSlug, disabled }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleStart() {
    setLoading(true)
    const result = await startExam(schoolId)

    if (!result.success) {
      toast.error(
        result.error === "QUOTA_EXCEEDED"
          ? "You've used your 3 free exams this month. Upgrade to Pro for unlimited access."
          : result.error === "INTERNAL"
          ? "Not enough questions seeded for this school yet."
          : "Failed to start exam. Please try again."
      )
      setLoading(false)
      return
    }

    router.push(`/exam/${schoolSlug}/session?attempt=${result.data.attemptId}`)
  }

  return (
    <button
      onClick={handleStart}
      disabled={disabled || loading}
      className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? "Starting…" : disabled ? "Quota Reached" : "Start Exam"}
    </button>
  )
}
