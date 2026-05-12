"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import type { CommunityMember } from "@/actions/community.actions"
import { MessageCircle, Search, Users } from "lucide-react"
import Link from "next/link"

const SCHOOL_COLORS: Record<string, string> = {
  UNILAG:  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  OAU:     "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  UI:      "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  UNIBEN:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  UNIPORT: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300",
  AFIT:    "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
}

function MemberCard({ member, isSelf }: { member: CommunityMember; isSelf: boolean }) {
  const abbr = member.school?.abbreviation ?? ""
  const colorClass = SCHOOL_COLORS[abbr] ?? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
  const waLink = `https://wa.me/${member.whatsapp_number.replace(/\D/g, "")}`

  return (
    <div className="group flex flex-col gap-3 rounded-2xl border bg-background p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
      {/* Avatar + name */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-sm font-black text-white shadow-sm">
          {member.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={member.avatar_url} alt={member.name} className="h-full w-full rounded-xl object-cover" />
          ) : (
            initials(member.name)
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold leading-tight">
            {member.name}
            {isSelf && <span className="ml-1.5 text-[10px] font-semibold text-muted-foreground">(you)</span>}
          </p>
          {member.school ? (
            <span className={cn("mt-0.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold", colorClass)}>
              {member.school.abbreviation}
            </span>
          ) : (
            <span className="mt-0.5 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              General
            </span>
          )}
        </div>
      </div>

      {/* WhatsApp button */}
      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 py-2.5 text-xs font-bold text-[#128C7E] transition-all hover:bg-[#25D366]/20 active:scale-[0.97] dark:text-[#25D366]"
      >
        <MessageCircle className="h-3.5 w-3.5" />
        Chat on WhatsApp
      </a>
    </div>
  )
}

export function CommunityClient({
  members,
  currentUserId,
}: {
  members: CommunityMember[]
  currentUserId: string
}) {
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState("All")

  // Build tab list from unique schools
  const schools = Array.from(
    new Map(
      members
        .filter((m) => m.school)
        .map((m) => [m.school!.abbreviation, m.school!])
    ).values()
  ).sort((a, b) => a.abbreviation.localeCompare(b.abbreviation))

  const tabs = ["All", ...schools.map((s) => s.abbreviation), "General"]

  // Filter
  const filtered = members.filter((m) => {
    const matchesSearch = !search.trim() || m.name.toLowerCase().includes(search.toLowerCase())
    const matchesTab =
      activeTab === "All" ||
      (activeTab === "General" && !m.school) ||
      m.school?.abbreviation === activeTab
    return matchesSearch && matchesTab
  })

  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-20 text-center">
        <Users className="mb-4 h-12 w-12 text-muted-foreground/30" />
        <h2 className="text-xl font-black">No members yet</h2>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Be the first! Add your WhatsApp number in your profile and toggle visibility.
        </p>
        <Link
          href="/profile"
          className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90"
        >
          Update my profile →
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name…"
          className="w-full rounded-xl border bg-background py-3 pl-10 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* School tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {tabs.map((tab) => {
          const count = tab === "All"
            ? members.length
            : tab === "General"
            ? members.filter((m) => !m.school).length
            : members.filter((m) => m.school?.abbreviation === tab).length
          if (count === 0 && tab !== "All") return null
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-all",
                activeTab === tab
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              {tab}
              <span className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-black",
                activeTab === tab ? "bg-white/20" : "bg-muted"
              )}>
                {count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-muted-foreground">
          <Search className="mb-3 h-8 w-8 opacity-30" />
          <p className="font-semibold">No matches found</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((m) => (
            <MemberCard key={m.id} member={m} isSelf={m.id === currentUserId} />
          ))}
        </div>
      )}
    </div>
  )
}
