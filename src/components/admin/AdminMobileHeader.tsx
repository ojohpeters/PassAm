"use client"

import { useState } from "react"
import { Menu, X, BookMarked } from "lucide-react"
import { AdminSidebar } from "./AdminSidebar"

export function AdminMobileHeader() {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Top bar — mobile only */}
      <header className="flex h-14 items-center justify-between border-b bg-background px-4 lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <BookMarked className="h-4 w-4 text-primary" />
          </div>
          <div className="leading-none">
            <p className="text-sm font-black text-primary">PassAm</p>
            <p className="text-[10px] text-muted-foreground font-semibold tracking-wide uppercase">Admin</p>
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-xl border bg-muted/50 transition-colors hover:bg-muted"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          {/* Drawer */}
          <div className="absolute inset-y-0 left-0 w-72 bg-background shadow-2xl">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg border hover:bg-muted"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
            <AdminSidebar onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
