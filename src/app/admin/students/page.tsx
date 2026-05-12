import { getStudents } from "@/actions/admin.actions"
import { BanToggle } from "@/components/admin/BanToggle"
import { formatDate } from "@/lib/utils"
import { Users, Search } from "lucide-react"

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>
}) {
  const { page: pageParam, q } = await searchParams
  const page   = Math.max(1, parseInt(pageParam ?? "1", 10))
  const search = q ?? ""

  const result = await getStudents(page, search)

  return (
    <div className="space-y-5 p-4 md:p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight">Students</h1>
        <p className="text-sm text-muted-foreground">{(result?.total ?? 0).toLocaleString()} registered students</p>
      </div>

      {/* Search */}
      <form method="GET" className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="q"
            defaultValue={search}
            placeholder="Search by name or email…"
            className="w-full rounded-xl border bg-background py-2.5 pl-10 pr-4 text-sm outline-none ring-primary/30 transition-all focus:border-primary focus:ring-2"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition-all hover:opacity-90"
        >
          Search
        </button>
        {search && (
          <a href="/admin/students" className="flex items-center rounded-xl border px-3 py-2.5 text-sm font-medium hover:bg-muted">
            Clear
          </a>
        )}
      </form>

      {/* Mobile: card list */}
      <div className="space-y-2 md:hidden">
        {(result?.students ?? []).length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Users className="mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="font-semibold text-muted-foreground">
              {search ? `No students match "${search}"` : "No students yet"}
            </p>
          </div>
        ) : (
          (result?.students ?? []).map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-2xl border bg-background p-4">
              {/* Avatar */}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-black text-primary">
                {s.avatar_url
                  ? <img src={s.avatar_url} alt={s.name} className="h-full w-full object-cover" />
                  : s.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
                }
              </div>
              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-bold text-sm">{s.name}</p>
                  {s.is_banned && (
                    <span className="shrink-0 rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/50 dark:text-rose-400">
                      BANNED
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">{s.email ?? "—"}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  {s.target_school && (
                    <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">{s.target_school}</span>
                  )}
                  <span className="text-[10px] text-muted-foreground">{s.examCount} exams · joined {formatDate(s.created_at)}</span>
                </div>
              </div>
              {/* Ban toggle */}
              <BanToggle userId={s.id} isBanned={s.is_banned} />
            </div>
          ))
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-hidden rounded-2xl border bg-background md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Student</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Joined</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">Target</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">Exams</th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(result?.students ?? []).map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-black text-primary">
                        {s.avatar_url
                          ? <img src={s.avatar_url} alt={s.name} className="h-full w-full object-cover" />
                          : s.name.split(" ").map((n: string) => n[0]).slice(0, 2).join("").toUpperCase()
                        }
                      </div>
                      <div>
                        <p className="font-semibold leading-tight">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.email ?? "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(s.created_at)}</td>
                  <td className="px-4 py-3">
                    {s.target_school
                      ? <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{s.target_school}</span>
                      : <span className="text-muted-foreground">—</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-center font-bold">{s.examCount}</td>
                  <td className="px-4 py-3 text-center">
                    <BanToggle userId={s.id} isBanned={s.is_banned} />
                  </td>
                </tr>
              ))}
              {(result?.students ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                    <Users className="mx-auto mb-2 h-8 w-8 opacity-30" />
                    {search ? `No students match "${search}"` : "No students yet"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {(result?.pages ?? 0) > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: result!.pages }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`/admin/students?page=${p}${search ? `&q=${encodeURIComponent(search)}` : ""}`}
              className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold transition-colors ${
                p === page ? "bg-primary text-primary-foreground" : "border hover:bg-muted"
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
