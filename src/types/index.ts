export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export type QuestionWithOptions = {
  id: string
  text: string
  image_url: string | null
  explanation: string | null
  year: number | null
  school_id: string
  subject_id: string
  options: { id: string; label: "A" | "B" | "C" | "D"; text: string }[]
  subject: { name: string }
}

export type ExamResult = {
  attemptId: string
  score: number
  totalQuestions: number
  percentage: number
}

export type SubjectAccuracy = {
  subjectId: string
  subjectName: string
  correct: number
  total: number
  accuracy: number
  isWeak: boolean
}

export type WeakSubjectInsight = SubjectAccuracy & { insight: string }

export type LeaderboardEntry = {
  rank: number
  userId: string
  name: string
  totalScore: number
  attempts: number
  isCurrentUser: boolean
}

export type DashboardStats = {
  totalAttempts: number
  averageScore: number
  currentStreak: number
  longestStreak: number
  dailyQuizReady: boolean
}
