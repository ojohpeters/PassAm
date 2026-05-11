import { getAppUser } from "@/lib/auth"
import Link from "next/link"
import { BookOpen } from "lucide-react"

export async function TopNav() {
  const user = await getAppUser()
  const firstName = user?.name?.split(" ")[0] ?? "Student"
  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "ST"

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/90 px-4 backdrop-blur-xl">
      <Link
        href="/dashboard"
        className="flex items-center gap-2 font-black text-lg text-primary tracking-tight"
      >
        <BookOpen className="h-5 w-5" />
        PassAm
      </Link>

      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-muted-foreground sm:block">
          Hey, <span className="font-semibold text-foreground">{firstName}</span> 👋
        </span>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {initials}
        </div>
      </div>
    </header>
  )
}
