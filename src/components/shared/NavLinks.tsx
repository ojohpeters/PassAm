"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Trophy, BarChart2, Calendar, UserCircle, MessageCircleHeart, Lightbulb, Users, Zap, BookOpen, BookX, Target, Layers } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV = [
  { href: "/dashboard",   label: "Dashboard",   icon: LayoutDashboard },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/sets",         label: "Practice Sets", icon: Layers   },
  { href: "/drill",        label: "Timed Drill",  icon: Zap      },
  { href: "/study-room",  label: "Study Room",   icon: BookOpen },
  { href: "/error-log",   label: "Error Log",    icon: BookX    },
  { href: "/weak-spots",  label: "Weak Spots",   icon: Target   },
  { href: "/analytics",   label: "Analytics",   icon: BarChart2 },
  { href: "/daily-quiz",  label: "Daily Quiz",  icon: Calendar },
  { href: "/tips",        label: "Study Tips",  icon: Lightbulb },
  { href: "/community",   label: "Community",   icon: Users },
  { href: "/profile",     label: "Profile",     icon: UserCircle },
  { href: "/contact",     label: "About & Help", icon: MessageCircleHeart },
]

export function NavLinks() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 space-y-0.5 p-3">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
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
            <Icon
              className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground")}
            />
            {label}
            {active && (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
