import Image from "next/image"
import Link from "next/link"
import { ExternalLink, ArrowRight } from "lucide-react"

const WA_TEACHER = "https://wa.me/2348139479853?text=Hi%2C+I%27m+a+PassAm+student.+I%27m+stuck+on+a+topic+and+need+help+%F0%9F%93%9A"
const WA_CHANNEL = "https://whatsapp.com/channel/0029Vb8eIXp4o7qUMP34jz3j"
const WA_GROUP   = "https://chat.whatsapp.com/JGMcTNHkrMs9Lq87ebRvHY"

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050d1f]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-2.5 sm:px-6">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.jpeg"
              alt="PassAm Prep"
              width={110}
              height={36}
              className="h-9 w-auto object-contain"
              priority
            />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-1.5 rounded-lg bg-blue-500 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-blue-400"
            >
              Start free <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-[#1a3a7c] to-[#0d2254] px-5 py-12 text-white text-center">
        <div className="mx-auto max-w-lg">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-white/10 ring-2 ring-white/20 backdrop-blur-sm overflow-hidden">
            <Image
              src="/logo.jpeg"
              alt="PassAm Prep"
              width={96}
              height={96}
              className="h-full w-full object-contain"
            />
          </div>
          <h1 className="text-3xl font-black tracking-tight">PassAm Prep</h1>
          <p className="mt-2 text-base font-semibold text-white/80 italic">Practice smart. PassAm.</p>
          <p className="mt-4 text-sm leading-relaxed text-white/70 max-w-sm mx-auto">
            Nigeria&apos;s smartest POST-UTME practice platform — helping students crush their
            admission exams one subject at a time.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-lg space-y-8 px-4 py-10 md:px-6">

        {/* ── About ── */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">About PassAm</h2>
          <div className="rounded-2xl border bg-background p-5 space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              <span className="font-bold text-foreground">PassAm Prep</span> was built for Nigerian students
              preparing for POST-UTME exams at top universities — UNILAG, OAU, UI, UNIBEN, UNIPORT, and more.
            </p>
            <p>
              We believe every student deserves focused, personalised practice. Choose your school, pick your
              subjects, and sit a timed exam that mirrors the real thing. Then review your answers, learn from
              explanations, and track your progress over time.
            </p>
            <p>
              Daily quizzes keep you sharp between full exams. Weekly leaderboards keep you motivated.
              And when you&apos;re stuck — there&apos;s always a human ready to help.
            </p>
          </div>
        </section>

        {/* ── Stuck? Get help ── */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Stuck on a Topic?</h2>
          <a
            href={WA_TEACHER}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 rounded-2xl border-2 border-[#25D366]/30 bg-[#25D366]/5 p-5 transition-all hover:border-[#25D366]/60 hover:bg-[#25D366]/10 active:scale-[0.99]"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#25D366]">
              <WhatsAppIcon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground">Demystify with Ojochegbe on WhatsApp</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Completely lost on a topic? Drop a message — he&apos;ll break it down until it fully clicks. 📚
              </p>
            </div>
            <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
          </a>
        </section>

        {/* ── Community ── */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Join the Community</h2>
          <div className="space-y-3">
            <a
              href={WA_CHANNEL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-2xl border bg-background p-4 transition-all hover:border-[#25D366]/40 hover:bg-[#25D366]/5 active:scale-[0.99]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#25D366]/10">
                <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">Interactive Study Channel</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Announcements, tips, exam updates — follow to stay in the loop
                </p>
              </div>
              <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
            </a>

            <a
              href={WA_GROUP}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-2xl border bg-background p-4 transition-all hover:border-[#25D366]/40 hover:bg-[#25D366]/5 active:scale-[0.99]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#25D366]/10">
                <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">PassAm Student Group</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Connect with fellow students, share resources, and prep together
                </p>
              </div>
              <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
            </a>
          </div>
        </section>

        {/* ── What we offer ── */}
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">What We Offer</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { emoji: "🎯", title: "Targeted Exams",  desc: "Practice by school & subject" },
              { emoji: "⏱️", title: "Timed Sessions",   desc: "Real exam pressure & pacing" },
              { emoji: "📖", title: "Explanations",     desc: "Learn from every answer" },
              { emoji: "📊", title: "Analytics",        desc: "Track your weak spots" },
              { emoji: "🔥", title: "Daily Quizzes",    desc: "Stay sharp every day" },
              { emoji: "🏆", title: "Leaderboards",     desc: "Compete with other students" },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="rounded-2xl border bg-background p-4 space-y-1">
                <span className="text-xl">{emoji}</span>
                <p className="font-bold text-sm">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="rounded-2xl bg-gradient-to-br from-[#1a3a7c] to-[#0d2254] p-6 text-center space-y-4">
          <p className="text-lg font-black text-white">Ready to start practising?</p>
          <p className="text-sm text-white/70">Free to start. No card needed. Just grind. 💪</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-2xl bg-blue-500 px-7 py-3.5 text-sm font-black text-white transition-all hover:bg-blue-400 active:scale-[0.98]"
          >
            Create free account <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        <p className="pb-4 text-center text-xs text-muted-foreground">
          Built with ❤️ for Nigerian students · &copy; {new Date().getFullYear()} PassAm Prep
        </p>

      </div>
    </div>
  )
}
