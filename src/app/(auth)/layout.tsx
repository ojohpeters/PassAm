import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Zap, Trophy, BarChart2, Calendar } from "lucide-react"

const FEATURES = [
  { icon: Zap,       text: "Timed CBT mock exams for your exact school" },
  { icon: BarChart2, text: "Analytics that show exactly where you're slacking" },
  { icon: Trophy,    text: "Weekly leaderboard — compete with your mates" },
  { icon: Calendar,  text: "Daily quizzes to build an unstoppable study habit" },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">

      {/* ── Left panel — branding ────────────────────────── */}
      {/* Mobile: compact banner at top. Desktop: full left half */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-blue-600 to-indigo-700 text-white lg:flex lg:w-[46%] lg:flex-col lg:justify-between lg:p-12">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 -left-8 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
        </div>

        {/* Mobile compact header */}
        <div className="relative flex items-center justify-between p-5 lg:hidden">
          <Link href="/" className="flex items-center">
            <Image src="/prepsiqlogo.png" alt="PrepIQ" width={110} height={36} className="h-9 w-auto object-contain" priority />
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-medium text-white/80 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
        </div>

        {/* Mobile tagline — visible only on mobile */}
        <div className="relative px-5 pb-6 lg:hidden">
          <p className="text-lg font-black leading-snug">
            Your POST-UTME prep just got a glow-up ✨
          </p>
          <p className="mt-1 text-sm text-white/70">
            School-specific CBT practice. Free forever.
          </p>
        </div>

        {/* Desktop full panel content */}
        <div className="relative hidden lg:flex lg:flex-col lg:justify-between lg:h-full">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image src="/prepsiqlogo.png" alt="PrepIQ" width={140} height={44} className="h-11 w-auto object-contain" priority />
          </Link>

          {/* Copy */}
          <div className="space-y-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-3">
                🇳🇬 For Nigerian students
              </p>
              <h2 className="text-3xl font-black leading-tight">
                Thousands of students
                <br />
                have already made it.
                <br />
                <span className="text-white/75">Now it&apos;s your turn.</span>
              </h2>
              <p className="mt-4 text-base text-white/65 leading-relaxed">
                School-specific POST-UTME practice that actually prepares you.
              </p>
            </div>

            <ul className="space-y-3">
              {FEATURES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-white/85">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/15">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>

            <div className="flex gap-6 border-t border-white/20 pt-6 text-sm">
              {[
                { value: "6+",     label: "Schools"       },
                { value: "1,000+", label: "Questions"      },
                { value: "100%",   label: "Free to start"  },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-xl font-black">{s.value}</p>
                  <p className="text-white/55 text-xs">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Testimonial */}
          <div className="rounded-2xl bg-white/10 p-5 border border-white/15 backdrop-blur-sm">
            <p className="text-sm italic text-white/85 leading-relaxed">
              &ldquo;I went from 45% to 82% in just three weeks. The daily quiz kept me consistent and the explanations actually made sense.&rdquo;
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-xs font-bold">AO</div>
              <div>
                <p className="text-xs font-semibold">Adaeze O.</p>
                <p className="text-[11px] text-white/55">Now studying at UI</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel — form ──────────────────────────────── */}
      <div className="flex flex-1 flex-col bg-background">
        {/* Desktop nav bar */}
        <header className="hidden items-center justify-between border-b px-8 py-4 lg:flex">
          <span />
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </header>

        {/* Form area — scrollable on mobile */}
        <main className="flex flex-1 items-start justify-center px-5 py-8 sm:items-center sm:py-12">
          <div className="w-full max-w-md">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
