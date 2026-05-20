import { getAdminQuizzes } from "@/actions/custom-quiz.actions"
import { getAppUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus, BookOpen, Users, ToggleLeft, ToggleRight, Link2 } from "lucide-react"

export const metadata = { title: "Quizzes — Admin" }

export default async function AdminQuizzesPage() {
  const user = await getAppUser()
  if (!user || user.role !== "ADMIN") redirect("/dashboard")

  const result = await getAdminQuizzes()
  const quizzes = result.success ? result.data : []

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Quizzes</h1>
          <p className="text-sm text-muted-foreground">{quizzes.length} quiz{quizzes.length !== 1 ? "zes" : ""} created</p>
        </div>
        <Link
          href="/admin/quizzes/new"
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          New Quiz
        </Link>
      </div>

      {quizzes.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed bg-muted/20 p-12 text-center">
          <p className="font-bold text-muted-foreground">No quizzes yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Create your first quiz to share with students</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((q) => (
            <Link
              key={q.id}
              href={`/admin/quizzes/${q.id}`}
              className="group flex flex-col gap-3 rounded-2xl border bg-background p-4 transition-all hover:border-primary/40 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${q.is_active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                  {q.is_active ? <ToggleRight className="h-3 w-3" /> : <ToggleLeft className="h-3 w-3" />}
                  {q.is_active ? "Active" : "Paused"}
                </span>
              </div>

              <div className="flex-1">
                <p className="font-bold leading-tight">{q.title}</p>
                {q.description && <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{q.description}</p>}
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {q.itemCount} questions</span>
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {q.attemptCount} attempts</span>
                <span className="flex items-center gap-1 ml-auto font-mono font-bold text-primary/70"><Link2 className="h-3 w-3" /> {q.code}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
