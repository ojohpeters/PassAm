import { getStudents } from "@/actions/admin.actions"
import { BanToggle } from "@/components/admin/BanToggle"
import { formatDate } from "@/lib/utils"
import { Users } from "lucide-react"

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
    <div className="space-y-6 p-6">

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Students</h1>
          <p className="text-sm text-muted-foreground">
            {result?.total ?? 0} registered students
          </p>
        </div>
      </div>

      {/* Search */}
      <form method="GET" className="flex gap-3">
        <input
          name="q"
          defaultValue={search}
          placeholder="Search by name or email…"
          className="flex-1 rounded-xl border bg-background px-4 py-2.5 text-sm text-foreground outline-none ring-primary/40 focus:border-primary focus:ring-2"
        />
        <button
          type="submit"
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Search
        </button>
        {search && (
          <a href="/admin/students" className="rounded-xl border px-4 py-2.5 text-sm font-medium hover:bg-muted">
            Clear
          </a>
        )}
      </form>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border bg-background">
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
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/20 text-xs font-black text-primary">
                        {s.avatar_url
                          ? <img src={s.avatar_url} alt={s.name} className="h-full w-full object-cover" />
                          : s.name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
                        }
                      </div>
                      <div>
                        <p className="font-semibold leading-tight">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.email ?? "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{formatDate(s.created_at)}</td>
                  <td className="px-4 py-3 text-sm">
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
                p === page
                  ? "bg-primary text-primary-foreground"
                  : "border hover:bg-muted"
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
