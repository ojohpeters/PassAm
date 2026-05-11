"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Trophy, Calendar, UserCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const TABS = [
  { href: "/dashboard",   label: "Home",    icon: LayoutDashboard },
  { href: "/leaderboard", label: "Ranks",   icon: Trophy          },
  { href: "/daily-quiz",  label: "Daily",   icon: Calendar        },
  { href: "/profile",     label: "Profile", icon: UserCircle      },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t bg-background/95 backdrop-blur-xl md:hidden">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
            {label}
            {active && <span className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-primary" />}
          </Link>
        )
      })}
    </nav>
  )
}
