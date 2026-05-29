"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, BookOpen, Users, Bell, MessageSquare, ChevronLeft, LogOut, BookMarked, School, Library, Building2, Lightbulb, ClipboardList, Radio, Layers, ClipboardCheck, ShieldCheck } from "lucide-react"
import { signOutAction } from "@/actions/auth.actions"

const NAV = [
  { href: "/admin",               label: "Overview",       icon: LayoutDashboard, exact: true },
  { href: "/admin/questions",     label: "Questions",      icon: BookOpen                     },
  { href: "/admin/sets",           label: "Sets",           icon: Layers                       },
  { href: "/admin/quizzes",       label: "Quizzes",        icon: ClipboardCheck               },
  { href: "/admin/tips",          label: "Study Tips",     icon: Lightbulb                    },
  { href: "/admin/subjects",      label: "Subjects",       icon: Library                      },
  { href: "/admin/schools",       label: "Schools",        icon: School                       },
  { href: "/admin/school-requests", label: "School Requests", icon: Building2                  },
  { href: "/admin/students",      label: "Students",       icon: Users                        },
  { href: "/admin/notifications", label: "Notifications",  icon: Bell                         },
  { href: "/admin/feedback",      label: "Reports",        icon: MessageSquare                },
  { href: "/admin/log-attendants",   label: "Log Attendants",   icon: ClipboardList },
  { href: "/admin/brainstorm-hosts",  label: "Brainstorm Hosts",  icon: Radio        },
  { href: "/admin/community-queue",   label: "Community Queue",   icon: ShieldCheck  },
]

export function AdminSidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
          <BookMarked className="h-5 w-5 text-primary" />
        </div>
        <div className="leading-none">
          <p className="font-black text-primary tracking-tight">PrepIQ</p>
          <p className="text-[11px] text-muted-foreground font-semibold tracking-wide uppercase">Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 p-3">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-3 space-y-1">
        <Link
          href="/dashboard"
          onClick={onClose}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to App
        </Link>
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-rose-100 hover:text-rose-700 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </form>
      </div>
    </div>
  )
}
