import type { ReactNode } from "react"
import Link from "next/link"
import Image from "next/image"

export default function QuizLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link href="/" className="flex items-center">
            <Image src="/prepsiqlogo.png" alt="PrepIQ" width={100} height={34} className="h-8 w-auto object-contain" priority />
          </Link>
          <Link
            href="/login"
            className="rounded-xl border px-3 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Login / Sign up
          </Link>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-6">
        {children}
      </main>
      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        Powered by <span className="font-bold text-primary">PrepIQ</span>
      </footer>
    </div>
  )
}
