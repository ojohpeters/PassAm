"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, BookOpen, Users, Bell, MessageSquare } from "lucide-react"

const NAV = [
  { href: "/admin",               label: "Overview",      icon: LayoutDashboard, exact: true },
  { href: "/admin/questions",     label: "Questions",     icon: BookOpen                     },
  { href: "/admin/students",      label: "Students",      icon: Users                        },
  { href: "/admin/notifications", label: "Notifications", icon: Bell                         },
  { href: "/admin/feedback",      label: "Reports",       icon: MessageSquare                },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 space-y-0.5 p-3">
      {NAV.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
              active
                ? "bg-primary/10 text-primary font-semibold"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "")} />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
