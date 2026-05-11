"use client"

function StarDot({ size, style }: { size: number; style: React.CSSProperties }) {
  return (
    <span
      className="absolute hero-sparkle text-blue-300/70"
      style={{ fontSize: size, lineHeight: 1, ...style }}
    >
      ✦
    </span>
  )
}

function StatCard({
  label,
  value,
  className = "",
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div
      className={`rounded-2xl border border-white/15 bg-white/10 px-3.5 py-2.5 backdrop-blur-md shadow-xl flex flex-col gap-0.5 ${className}`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-widest text-white/50 leading-none">
        {label}
      </span>
      <span className="text-sm font-black text-white leading-tight">{value}</span>
    </div>
  )
}

function Book3D() {
  return (
    <div className="animate-book-3d" style={{ transformStyle: "preserve-3d" }}>
      {/* Outer drop shadow ring */}
      <div className="absolute inset-0 rounded-2xl opacity-40 blur-xl bg-blue-400 scale-110 pointer-events-none" />

      <div className="relative flex" style={{ width: 180, height: 130 }}>
        {/* Left page */}
        <div
          className="relative flex flex-col justify-center gap-2.5 overflow-hidden rounded-l-xl px-4"
          style={{
            width: 88,
            height: 130,
            background: "linear-gradient(135deg, hsl(220 80% 96%), hsl(220 60% 99%))",
            borderRight: "none",
            border: "1.5px solid rgba(255,255,255,0.5)",
            boxShadow: "inset -4px 0 8px rgba(0,0,0,0.06)",
          }}
        >
          {[80, 100, 65, 90, 55, 75].map((w, i) => (
            <div key={i} className="h-[3px] rounded-full bg-blue-300/40" style={{ width: `${w}%` }} />
          ))}
          <div className="mt-1 text-center text-xl leading-none">🎓</div>
        </div>

        {/* Right page */}
        <div
          className="relative flex flex-col justify-center gap-2.5 overflow-hidden rounded-r-xl px-4"
          style={{
            width: 88,
            height: 130,
            background: "linear-gradient(225deg, hsl(220 60% 99%), hsl(220 80% 96%))",
            borderLeft: "none",
            border: "1.5px solid rgba(255,255,255,0.5)",
            boxShadow: "inset 4px 0 8px rgba(0,0,0,0.04)",
          }}
        >
          {[90, 70, 100, 60, 85, 45].map((w, i) => (
            <div key={i} className="h-[3px] rounded-full bg-blue-300/40" style={{ width: `${w}%` }} />
          ))}
          <div className="mt-1 text-center text-xl leading-none">📊</div>
        </div>

        {/* Spine */}
        <div
          className="absolute left-1/2 top-0 z-10 -translate-x-1/2 rounded-full"
          style={{ width: 5, height: 130, background: "linear-gradient(to bottom, #60a5fa, #3b82f6)" }}
        />

        {/* Book shadow beneath */}
        <div className="absolute -bottom-4 left-6 right-6 h-4 rounded-full blur-md bg-black/30" />
      </div>
    </div>
  )
}

export function HeroAnimation() {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ height: 320, width: "100%" }}
      aria-hidden="true"
    >
      {/* Glow orb behind book */}
      <div
        className="absolute rounded-full blur-3xl"
        style={{ width: 220, height: 220, background: "radial-gradient(circle, rgba(96,165,250,0.25), transparent 70%)" }}
      />

      {/* Sparkles */}
      <StarDot size={10} style={{ top: "6%",  left: "12%",  animationDelay: "0s"   }} />
      <StarDot size={7}  style={{ top: "12%", right: "14%", animationDelay: "0.7s" }} />
      <StarDot size={12} style={{ top: "55%", left: "5%",   animationDelay: "1.4s" }} />
      <StarDot size={6}  style={{ bottom: "10%", right: "8%", animationDelay: "0.4s" }} />
      <StarDot size={9}  style={{ bottom: "28%", left: "18%", animationDelay: "1.1s" }} />
      <StarDot size={7}  style={{ top: "42%", right: "4%",  animationDelay: "1.8s" }} />

      {/* Central 3D book */}
      <div className="relative z-10">
        <Book3D />
      </div>

      {/* Stat cards — hidden on very small screens */}
      <div
        className="hero-float-alt absolute hidden sm:block"
        style={{ top: "6%", left: "0%", animationDelay: "0s" }}
      >
        <StatCard label="Avg Score" value="94% 📈" />
      </div>

      <div
        className="hero-float absolute hidden sm:block"
        style={{ bottom: "12%", left: "2%", animationDelay: "0.8s" }}
      >
        <StatCard label="Study Streak" value="7 days 🔥" />
      </div>

      <div
        className="hero-float-alt absolute hidden sm:block"
        style={{ top: "10%", right: "0%", animationDelay: "1.3s" }}
      >
        <StatCard label="Leaderboard" value="#12 🏆" />
      </div>

      <div
        className="hero-float-slow absolute hidden sm:block"
        style={{ bottom: "8%", right: "1%", animationDelay: "0.4s" }}
      >
        <StatCard label="School Ready" value="UNILAG ✓" />
      </div>
    </div>
  )
}
