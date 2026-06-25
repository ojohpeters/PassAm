"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Trophy, Calendar, UserCircle, MoreHorizontal, BarChart2, MessageCircleHeart, Globe, X, Lightbulb, Users, Zap, BookOpen, BookX, Target, Layers, GaugeCircle, LibraryBig, Bot, BookMarked, Swords } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

const MAIN_TABS = [
  { href: "/dashboard",   label: "Home",    icon: LayoutDashboard },
  { href: "/leaderboard", label: "Ranks",   icon: Trophy          },
  { href: "/daily-quiz",  label: "Daily",   icon: Calendar        },
  { href: "/profile",     label: "Profile", icon: UserCircle      },
]

const MORE_ITEMS = [
  { href: "/readiness",    label: "Readiness",    icon: GaugeCircle         },
  { href: "/sets",         label: "Practice Sets", icon: Layers              },
  { href: "/drill",        label: "Timed Drill",  icon: Zap                 },
  { href: "/study-room",   label: "Study Room",   icon: BookOpen            },
  { href: "/my-questions", label: "My Bank",      icon: LibraryBig          },
  { href: "/prepai",       label: "PrepAI",       icon: Bot                 },
  { href: "/error-log",    label: "Error Log",    icon: BookX               },
  { href: "/weak-spots",   label: "Weak Spots",   icon: Target              },
  { href: "/tips",         label: "Study Tips",   icon: Lightbulb           },
  { href: "/challenge/create",    label: "1v1 Challenge",  icon: Swords    },
  { href: "/community/questions", label: "Community Q's", icon: BookMarked },
  { href: "/community",          label: "Community",    icon: Users      },
  { href: "/analytics",    label: "Analytics",    icon: BarChart2           },
  { href: "/exam/general", label: "General Exam", icon: Globe               },
  { href: "/contact",      label: "About & Help", icon: MessageCircleHeart  },
]

export function BottomNav() {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  const moreActive = MORE_ITEMS.some((i) => pathname.startsWith(i.href))

  return (
    <>
      {/* More panel overlay */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setMoreOpen(false)}
        />
      )}

      {/* More slide-up panel */}
      <div className={cn(
        "fixed bottom-[57px] left-0 right-0 z-50 md:hidden transition-all duration-200",
        moreOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
      )}>
        <div className="mx-4 mb-2 overflow-hidden rounded-2xl border bg-background/95 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">More</p>
            <button onClick={() => setMoreOpen(false)} className="rounded-lg p-1 text-muted-foreground hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>
          {MORE_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMoreOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3.5 text-sm font-semibold transition-colors border-b last:border-0",
                  active ? "text-primary bg-primary/5" : "text-foreground hover:bg-muted"
                )}
              >
                <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
                {label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t bg-background/95 backdrop-blur-xl md:hidden">
        {MAIN_TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", active ? "text-primary" : "text-muted-foreground")} />
              {label}
              {active && <span className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-primary" />}
            </Link>
          )
        })}

        {/* More button */}
        <button
          onClick={() => setMoreOpen((v) => !v)}
          className={cn(
            "relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-semibold transition-colors",
            moreActive || moreOpen ? "text-primary" : "text-muted-foreground"
          )}
        >
          <MoreHorizontal className={cn("h-5 w-5", moreActive || moreOpen ? "text-primary" : "text-muted-foreground")} />
          More
          {(moreActive || moreOpen) && <span className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-primary" />}
        </button>
      </nav>
    </>
  )
}
