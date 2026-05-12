import { getAdminStats } from "@/actions/admin.actions"
import { createAdminClient } from "@/lib/supabase/admin"
import Link from "next/link"
import { BookOpen, Users, Activity, MessageSquare, Plus, Bell, ChevronRight } from "lucide-react"
import { cn, formatDate } from "@/lib/utils"

export default async function AdminPage() {
  const admin = createAdminClient()
  const stats = await getAdminStats()

  const { data: recentAttempts } = await admin
    .from("exam_attempts")
    .select("id, score, total_questions, created_at, user:profiles(name), school:schools(abbreviation)")
    .not("completed_at", "is", null)
    .order("created_at", { ascending: false })
    .limit(8)

  const statCards = [
    { label: "Students",      value: stats?.totalUsers      ?? 0, icon: Users,         href: "/admin/students",      color: "text-blue-600",    bg: "bg-blue-50 dark:bg-blue-950/40",     border: "border-blue-100 dark:border-blue-900/40",    iconBg: "bg-blue-100 dark:bg-blue-900/60"    },
    { label: "Questions",     value: stats?.totalQuestions  ?? 0, icon: BookOpen,      href: "/admin/questions",     color: "text-violet-600",  bg: "bg-violet-50 dark:bg-violet-950/40",  border: "border-violet-100 dark:border-violet-900/40", iconBg: "bg-violet-100 dark:bg-violet-900/60" },
    { label: "Exams Today",   value: stats?.attemptsToday   ?? 0, icon: Activity,      href: null,                   color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40",border: "border-emerald-100 dark:border-emerald-900/40",iconBg: "bg-emerald-100 dark:bg-emerald-900/60" },
    { label: "Reports",       value: stats?.pendingFeedback ?? 0, icon: MessageSquare, href: "/admin/feedback",      color: "text-orange-600",  bg: "bg-orange-50 dark:bg-orange-950/40",  border: "border-orange-100 dark:border-orange-900/40", iconBg: "bg-orange-100 dark:bg-orange-900/60" },
  ]

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">Platform health at a glance</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((s) => {
          const card = (
            <div className={cn("rounded-2xl border p-4 transition-all", s.bg, s.border, s.href && "hover:-translate-y-0.5 hover:shadow-md cursor-pointer")}>
              <div className={cn("mb-3 flex h-9 w-9 items-center justify-center rounded-xl", s.iconBg)}>
                <s.icon className={cn("h-4 w-4", s.color)} />
              </div>
              <p className="text-3xl font-black">{s.value.toLocaleString()}</p>
              <p className="mt-0.5 text-xs font-medium text-muted-foreground">{s.label}</p>
            </div>
          )
          return s.href ? (
            <Link key={s.label} href={s.href}>{card}</Link>
          ) : (
            <div key={s.label}>{card}</div>
          )
        })}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { href: "/admin/questions/new", label: "Add Questions",  icon: Plus,          primary: true  },
            { href: "/admin/students",      label: "Manage Students",icon: Users,         primary: false },
            { href: "/admin/notifications", label: "Broadcast",      icon: Bell,          primary: false },
            { href: "/admin/feedback",      label: `Reports (${stats?.pendingFeedback ?? 0})`, icon: MessageSquare, primary: false },
          ].map(({ href, label, icon: Icon, primary }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]",
                primary
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : "border bg-background hover:bg-muted"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recent Exams</h2>
          <Link href="/admin/students" className="flex items-center gap-0.5 text-xs font-semibold text-primary hover:underline">
            All students <ChevronRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-background">
          {(recentAttempts ?? []).length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No exam attempts yet</p>
          ) : (
            <div className="divide-y">
              {(recentAttempts ?? []).map((a) => {
                const pct   = Math.round((a.score / a.total_questions) * 100)
                const pass  = pct >= 50
                const user  = a.user   as any
                const school = a.school as any
                return (
                  <div key={a.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                    <div className={cn(
                      "flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl text-xs font-black",
                      pass
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                        : "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400"
                    )}>
                      <span className="text-sm leading-none">{pct}</span>
                      <span className="text-[9px] opacity-60">%</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{user?.name ?? "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{school?.abbreviation ?? "—"} · {formatDate(a.created_at)}</p>
                    </div>
                    <span className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                      pass
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300"
                        : "bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300"
                    )}>{pass ? "PASS" : "FAIL"}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
