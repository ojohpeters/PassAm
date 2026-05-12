import { getAppUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { BookOpen, Zap, BarChart2, Trophy, Calendar, Shield, ArrowRight, ChevronDown, Globe } from "lucide-react"
import Image from "next/image"
import { HeroAnimation } from "@/components/landing/HeroAnimation"
import { AnimatedCounter } from "@/components/landing/AnimatedCounter"
import { ScrollReveal } from "@/components/landing/ScrollReveal"
import { TestimonialMarquee } from "@/components/landing/TestimonialMarquee"

export default async function LandingPage() {
  const user = await getAppUser()
  if (user) redirect("/dashboard")

  const FEATURES = [
    {
      icon: Zap,
      title: "Real exam. Real pressure. 🎯",
      desc: "Timed CBT mock exams that mirror the actual POST-UTME — 40 questions, 60 minutes, auto-scored. No dulling.",
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
      border: "hover:border-yellow-400/30",
    },
    {
      icon: BarChart2,
      title: "See exactly where you're slacking 📊",
      desc: "Subject-by-subject accuracy, score trends, and weak-area insights. Know your problem before exam day.",
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      border: "hover:border-blue-400/30",
    },
    {
      icon: Trophy,
      title: "Compete with your mates 🏆",
      desc: "Weekly leaderboard per school. Rankings reset every Monday. Can your friends catch up to you?",
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      border: "hover:border-amber-400/30",
    },
    {
      icon: Calendar,
      title: "Daily quiz + streak 🔥",
      desc: "10 fresh questions every day. Miss a day and your streak resets. Build the habit — it compounds.",
      color: "text-green-400",
      bg: "bg-green-400/10",
      border: "hover:border-green-400/30",
    },
    {
      icon: BookOpen,
      title: "YOUR school's questions 🏫",
      desc: "UNILAG, OAU, UI, UNIBEN, UNIPORT, AFIT — questions actually curated for your target school.",
      color: "text-primary",
      bg: "bg-primary/10",
      border: "hover:border-primary/30",
    },
    {
      icon: Shield,
      title: "Explanation for every answer 💡",
      desc: "Every question has a clear breakdown — you understand the concept, not just memorise the answer.",
      color: "text-rose-400",
      bg: "bg-rose-400/10",
      border: "hover:border-rose-400/30",
    },
  ]

  const SCHOOLS = ["UNILAG", "OAU", "UI", "UNIBEN", "UNIPORT", "AFIT"]

  const STEPS = [
    {
      n: "01",
      emoji: "✍️",
      title: "Create your free account",
      desc: "30 seconds. No card. No stress. Just your email and password.",
    },
    {
      n: "02",
      emoji: "🎯",
      title: "Pick your school, start your exam",
      desc: "Select the university you're targeting and jump straight into a timed mock.",
    },
    {
      n: "03",
      emoji: "📈",
      title: "Review, grind, repeat",
      desc: "Check your score breakdown, study your weak subjects, take the daily quiz, climb the board.",
    },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground antialiased overflow-x-hidden">

      {/* ── Nav ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050d1f]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 sm:px-6">
          <Link href="/" className="flex items-center">
            <Image src="/prepiqlogo.png" alt="PrepIQ" width={120} height={40} className="h-10 w-auto object-contain" priority />
          </Link>
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/about"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:text-white sm:block"
            >
              About
            </Link>
            <Link
              href="/login"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-white/70 transition-colors hover:text-white sm:block"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="flex items-center gap-1.5 rounded-lg bg-blue-500 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-blue-400 hover:shadow-lg hover:shadow-blue-500/30"
            >
              Start free
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative min-h-[92dvh] overflow-hidden bg-[#050d1f] flex flex-col justify-center">
        {/* Animated gradient blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="animate-blob absolute -top-32 -left-20 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl sm:h-[500px] sm:w-[500px]" />
          <div className="animate-blob-delay-2 absolute top-1/3 -right-20 h-64 w-64 rounded-full bg-indigo-600/20 blur-3xl sm:h-96 sm:w-96" />
          <div className="animate-blob-delay-4 absolute -bottom-20 left-1/3 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl" />
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)", backgroundSize: "64px 64px" }}
          />
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">

            {/* Copy */}
            <div className="text-center md:text-left">
              {/* Badge */}
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-green-500/30 bg-green-500/10 px-4 py-1.5 text-xs font-bold text-green-400">
                🇳🇬 Built for Nigerian students, by Nigerians
              </div>

              <h1 className="text-[2.6rem] font-black leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Your POST-UTME
                <br />
                prep just got a{" "}
                <span
                  className="animate-gradient-x bg-clip-text text-transparent"
                  style={{ backgroundImage: "linear-gradient(270deg, #34d399, #60a5fa, #a78bfa, #34d399)" }}
                >
                  glow-up ✨
                </span>
              </h1>

              <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-white/65 md:mx-0 md:text-lg">
                School-specific CBT practice, analytics, and daily quizzes — all free.
                Built for students writing{" "}
                <span className="font-semibold text-white/90">{SCHOOLS.join(", ")}</span>.{" "}
                <span className="text-green-400 font-semibold">No cap.</span>
              </p>

              {/* Inline mini stats */}
              <div className="my-7 flex flex-wrap justify-center gap-x-6 gap-y-2 md:justify-start">
                {[
                  { val: "1000", suffix: "+", label: "Questions" },
                  { val: "6",   suffix: "+",  label: "Schools"   },
                  { val: "100", suffix: "%",  label: "Free start" },
                ].map((s) => (
                  <div key={s.label} className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-white">
                      <AnimatedCounter to={parseInt(s.val)} suffix={s.suffix} />
                    </span>
                    <span className="text-sm text-white/50">{s.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col items-center gap-3 sm:flex-row md:justify-start">
                <Link
                  href="/register"
                  className="animate-glow-pulse flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-500 px-7 py-4 text-sm font-black text-white transition-all hover:bg-blue-400 sm:w-auto"
                >
                  Start practising — it&apos;s free 🚀
                </Link>
                <Link
                  href="/login"
                  className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-white/15 px-7 py-4 text-sm font-semibold text-white/80 transition-all hover:border-white/30 hover:text-white sm:w-auto"
                >
                  I have an account →
                </Link>
              </div>
              <p className="mt-3.5 text-xs text-white/35">100% free · No credit card needed</p>
            </div>

            {/* 3D Animation — desktop */}
            <div className="hidden items-center justify-center md:flex">
              <HeroAnimation />
            </div>
          </div>

          {/* 3D Animation — mobile (below text) */}
          <div className="mt-6 md:hidden">
            <HeroAnimation />
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/30">
          <span className="text-[10px] font-semibold uppercase tracking-widest">Scroll</span>
          <ChevronDown className="h-4 w-4 animate-bounce-y" />
        </div>
      </section>

      {/* ── School chips ───────────────────────────────────── */}
      <section className="border-b border-border/50 bg-background py-10 px-4">
        <p className="mb-5 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Practice questions for
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {SCHOOLS.map((s) => (
            <span
              key={s}
              className="rounded-full border border-primary/20 bg-primary/5 px-5 py-2 text-sm font-bold text-primary transition-all hover:bg-primary/10 hover:shadow-md hover:shadow-primary/10"
            >
              {s}
            </span>
          ))}
          <Link
            href="/register"
            className="rounded-full border border-dashed border-primary/30 bg-primary/5 px-5 py-2 text-sm font-semibold text-primary transition-all hover:bg-primary/10"
          >
            + more coming
          </Link>
          <Link
            href="/register"
            className="flex items-center gap-1.5 rounded-full border border-dashed border-slate-400/30 bg-slate-50/5 px-5 py-2 text-sm font-semibold text-slate-400 transition-all hover:bg-slate-400/10"
          >
            <Globe className="h-3.5 w-3.5" />
            General Practice
          </Link>
        </div>
      </section>

      {/* ── Animated stats ─────────────────────────────────── */}
      <section className="bg-gradient-to-r from-primary/5 via-background to-primary/5 py-14 px-4 border-b">
        <div className="mx-auto grid max-w-3xl grid-cols-3 gap-4 text-center">
          {[
            { to: 1000, suffix: "+", label: "Practice questions", emoji: "📝" },
            { to: 6,    suffix: "+", label: "Schools covered",    emoji: "🏫" },
            { to: 100,  suffix: "%", label: "Free to start",      emoji: "🎁" },
          ].map((s) => (
            <ScrollReveal key={s.label}>
              <div className="rounded-2xl border border-border/50 bg-background p-5 shadow-sm">
                <p className="text-2xl sm:text-3xl font-black text-primary">
                  {s.emoji} <AnimatedCounter to={s.to} suffix={s.suffix} />
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <ScrollReveal className="mb-14 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">What you get</p>
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
            Everything you need.
            <br className="sm:hidden" /> Nothing extra.
          </h2>
          <p className="mt-3 text-muted-foreground">
            We built exactly what you need to pass — no fluff, no tricks.
          </p>
        </ScrollReveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc, color, bg, border }, i) => (
            <ScrollReveal key={title} delay={i * 80}>
              <div
                className={`group h-full rounded-2xl border border-border/50 bg-background p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${border}`}
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <h3 className="font-bold leading-snug">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── Demystify / Teacher section ────────────────────── */}
      <section className="relative overflow-hidden bg-[#050d1f] py-20 px-4">
        {/* Glow blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-[#25D366]/8 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-[#25D366]/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-5xl">
          <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">

            {/* ── Left copy ── */}
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#25D366]/30 bg-[#25D366]/10 px-4 py-1.5 text-xs font-bold text-[#25D366] mb-5">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                Demystify with Ojochegbe
              </div>

              <h2 className="text-3xl font-black leading-tight text-white sm:text-4xl">
                That stubborn topic?
                <br />
                <span className="text-[#25D366]">Ojochegbe will kill it.</span> 💡
              </h2>

              <p className="mt-4 text-base leading-relaxed text-white/60">
                Some topics just won&apos;t click from a textbook. Ojochegbe is available
                <span className="font-semibold text-white/90"> directly on WhatsApp</span> — send
                the topic, the question, or the concept that&apos;s giving you wahala, and he&apos;ll
                break it down personally, step by step, until it fully clicks.
              </p>

              <ul className="mt-5 space-y-2.5">
                {[
                  "Send any topic or question that's confusing you",
                  "Get a personal, detailed breakdown — not a copy-paste answer",
                  "Ask follow-up questions until you truly understand",
                  "100% free. No gatekeeping. No stress.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-white/70">
                    <span className="mt-0.5 shrink-0 text-[#25D366]">✓</span>
                    {item}
                  </li>
                ))}
              </ul>

              <a
                href="https://wa.me/2348139479853?text=Hi%2C+I%27m+a+PrepIQ+student.+I%27m+stuck+on+a+topic+and+need+help+%F0%9F%93%9A"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-[#25D366] px-7 py-4 text-sm font-black text-white shadow-lg shadow-[#25D366]/30 transition-all hover:bg-[#1ebe5d] hover:shadow-xl hover:shadow-[#25D366]/40 active:scale-[0.98]"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                Demystify with Ojochegbe now
              </a>
              <p className="mt-2.5 text-xs text-white/30">Opens WhatsApp · Free · No account needed</p>
            </ScrollReveal>

            {/* ── Right: fake WhatsApp chat mockup ── */}
            <ScrollReveal delay={150} className="flex justify-center md:justify-end">
              <div className="w-full max-w-sm">
                {/* Phone frame */}
                <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0a1628] shadow-2xl shadow-black/60">
                  {/* WhatsApp header */}
                  <div className="flex items-center gap-3 bg-[#1a2e46] px-4 py-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-sm font-black text-white">T</div>
                    <div>
                      <p className="text-xs font-bold text-white">Ojochegbe</p>
                      <p className="text-[10px] text-white/50">online</p>
                    </div>
                    <svg viewBox="0 0 24 24" className="ml-auto h-5 w-5 fill-[#25D366]"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                  </div>

                  {/* Messages */}
                  <div className="space-y-3 bg-[#0d1f35] px-4 py-5">
                    {/* Student message */}
                    <div className="flex justify-end">
                      <div className="max-w-[78%] rounded-2xl rounded-tr-sm bg-[#25D366]/20 px-3.5 py-2.5">
                        <p className="text-xs text-white/90">I don&apos;t understand integration by substitution at all 😭 exam is in 3 days</p>
                        <p className="mt-1 text-right text-[9px] text-white/35">10:42 AM ✓✓</p>
                      </div>
                    </div>

                    {/* Teacher message 1 */}
                    <div className="flex justify-start">
                      <div className="max-w-[82%] rounded-2xl rounded-tl-sm bg-white/8 px-3.5 py-2.5">
                        <p className="text-xs text-white/90">Don&apos;t panic 🙌 Let me break it down in a way that actually makes sense.</p>
                        <p className="mt-1 text-[9px] text-white/35">10:43 AM</p>
                      </div>
                    </div>

                    {/* Teacher message 2 */}
                    <div className="flex justify-start">
                      <div className="max-w-[88%] rounded-2xl rounded-tl-sm bg-white/8 px-3.5 py-2.5">
                        <p className="text-xs text-white/90">Think of substitution like a name swap. You see a messy expression inside — you give it a simpler name like <span className="font-bold text-[#25D366]">u</span>, do the maths with <span className="font-bold text-[#25D366]">u</span>, then swap the name back at the end.</p>
                        <p className="mt-1 text-[9px] text-white/35">10:44 AM</p>
                      </div>
                    </div>

                    {/* Student reply */}
                    <div className="flex justify-end">
                      <div className="max-w-[68%] rounded-2xl rounded-tr-sm bg-[#25D366]/20 px-3.5 py-2.5">
                        <p className="text-xs text-white/90">OHHH that actually makes sense now 🔥🔥 can we try one example?</p>
                        <p className="mt-1 text-right text-[9px] text-white/35">10:46 AM ✓✓</p>
                      </div>
                    </div>

                    {/* Typing indicator */}
                    <div className="flex justify-start">
                      <div className="rounded-2xl rounded-tl-sm bg-white/8 px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="loading-dot h-1.5 w-1.5 rounded-full bg-white/50 text-white">•</span>
                          <span className="loading-dot h-1.5 w-1.5 rounded-full bg-white/50 text-white">•</span>
                          <span className="loading-dot h-1.5 w-1.5 rounded-full bg-white/50 text-white">•</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="mt-3 text-center text-xs text-white/30">
                  Real conversations. Real understanding. 🇳🇬
                </p>
              </div>
            </ScrollReveal>

          </div>
        </div>
      </section>

      {/* ── Testimonials marquee ───────────────────────────── */}
      <section className="overflow-hidden bg-[#050d1f] py-16">
        <ScrollReveal className="mb-10 px-4 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blue-400">
            Real students, real results 👀
          </p>
          <h2 className="text-2xl font-black text-white sm:text-3xl">
            They gassed us — and we delivered 💯
          </h2>
        </ScrollReveal>
        <TestimonialMarquee />
      </section>

      {/* ── How it works ───────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
        <ScrollReveal className="mb-12 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-primary">Simple process</p>
          <h2 className="text-3xl font-black tracking-tight">3 steps. That's it. 👇</h2>
        </ScrollReveal>

        <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-3 md:gap-6">
          {STEPS.map((step, i) => (
            <ScrollReveal key={step.n} delay={i * 120}>
              <div className="relative flex gap-5 rounded-2xl border border-border/50 bg-background p-6 md:flex-col md:gap-3">
                {/* Step number line connector on mobile */}
                {i < STEPS.length - 1 && (
                  <div className="absolute left-[2.15rem] top-full h-4 w-0.5 bg-border md:hidden" />
                )}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xl">
                  {step.emoji}
                </div>
                <div>
                  <span className="text-xs font-black tracking-widest text-primary/40">{step.n}</span>
                  <h3 className="mt-0.5 font-bold tracking-tight">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ── Motivation strip ───────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#050d1f] py-16 px-4 text-center">
        <div className="pointer-events-none absolute inset-0">
          <div className="animate-blob absolute -top-20 left-1/4 h-64 w-64 rounded-full bg-blue-600/15 blur-3xl" />
          <div className="animate-blob-delay-2 absolute -bottom-20 right-1/4 h-64 w-64 rounded-full bg-indigo-600/15 blur-3xl" />
        </div>
        <ScrollReveal className="relative mx-auto max-w-2xl space-y-4">
          <p className="text-4xl">💪</p>
          <h2 className="text-3xl font-black text-white sm:text-4xl">
            Every student who got into
            <br />
            <span
              className="animate-gradient-x bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(270deg, #34d399, #60a5fa, #a78bfa, #34d399)" }}
            >
              their dream school
            </span>
            <br />
            had to start somewhere.
          </h2>
          <p className="text-white/60">
            The ones who made it didn&apos;t wait for the perfect moment.
            <br className="hidden sm:block" />
            They just started. <span className="text-green-400 font-semibold">You can too.</span>
          </p>
          <Link
            href="/register"
            className="animate-glow-pulse mt-4 inline-flex items-center gap-2 rounded-2xl bg-blue-500 px-8 py-4 text-sm font-black text-white transition-all hover:bg-blue-400"
          >
            I&apos;m ready — let&apos;s go 🚀
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-xs text-white/30 pt-1">100% free · Just grind 💪</p>
        </ScrollReveal>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="border-t bg-background">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-7 text-xs text-muted-foreground md:flex-row">
          <div className="flex items-center">
            <Image src="/prepiqlogo.png" alt="PrepIQ" width={90} height={30} className="h-8 w-auto object-contain" />
          </div>
          <p>© {new Date().getFullYear()} PrepIQ. Built for Nigerian students. 🇳🇬</p>
          <div className="flex gap-6">
            <Link href="/about" className="transition-colors hover:text-foreground">About</Link>
            <Link href="/login" className="transition-colors hover:text-foreground">Sign in</Link>
            <Link href="/register" className="transition-colors hover:text-foreground">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
