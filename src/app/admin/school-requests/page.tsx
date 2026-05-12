import { getSchoolRequests, markSchoolRequestNoted } from "@/actions/school.actions"
import { getAppUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { formatDate } from "@/lib/utils"
import { cn } from "@/lib/utils"
import { School, CheckCheck, Clock } from "lucide-react"

export default async function SchoolRequestsPage() {
  const user = await getAppUser()
  if (!user || user.role !== "ADMIN") redirect("/dashboard")

  const requests = await getSchoolRequests()

  const pending = (requests ?? []).filter((r) => r.status === "PENDING").length

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">School Requests</h1>
          <p className="text-sm text-muted-foreground">
            Students requesting their schools be added
            {pending > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                {pending} pending
              </span>
            )}
          </p>
        </div>
      </div>

      {(!requests || requests.length === 0) ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border bg-background py-20 text-center">
          <School className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="font-semibold text-muted-foreground">No requests yet</p>
          <p className="mt-1 text-sm text-muted-foreground/70">School requests from students will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.id}
              className={cn(
                "rounded-2xl border bg-background p-4 space-y-3",
                req.status === "NOTED" && "opacity-60"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <School className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold">{req.school_name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      {req.user_name && <span>{req.user_name}</span>}
                      {req.user_email && <span className="font-mono">{req.user_email}</span>}
                      <span>{formatDate(req.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <span className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
                    req.status === "NOTED"
                      ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400"
                  )}>
                    {req.status === "NOTED"
                      ? <><CheckCheck className="h-3 w-3" /> Noted</>
                      : <><Clock className="h-3 w-3" /> Pending</>
                    }
                  </span>

                  {req.status === "PENDING" && (
                    <form action={async () => {
                      "use server"
                      await markSchoolRequestNoted(req.id)
                    }}>
                      <button
                        type="submit"
                        className="rounded-xl border bg-background px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-muted"
                      >
                        Mark noted
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {req.message && (
                <div className="rounded-xl bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground leading-relaxed">
                  {req.message}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
