/**
 * PrepIQ brand logo — a flame whose tip forms a graduation cap.
 * Orange base (hustle) → violet/indigo top (academic achievement).
 * Tassel hangs from the top-right corner of the mortarboard.
 */

export function PrepIQLogo({
  size = 40,
  className = "",
}: {
  size?: number
  className?: string
}) {
  const h = Math.round((size * 52) / 40)
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 40 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="PrepIQ"
    >
      <defs>
        <linearGradient
          id="prepiq-g"
          x1="20" y1="49"
          x2="20" y2="2"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%"   stopColor="#f97316" /> {/* orange  — flame base  */}
          <stop offset="48%"  stopColor="#a855f7" /> {/* violet  — mid flame   */}
          <stop offset="100%" stopColor="#4f46e5" /> {/* indigo  — cap top     */}
        </linearGradient>
        <linearGradient
          id="prepiq-tassel"
          x1="28" y1="3"
          x2="36" y2="22"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%"   stopColor="#f97316" />
          <stop offset="100%" stopColor="#fb923c" />
        </linearGradient>
      </defs>

      {/* ── Flame body + mortarboard cap (single merged silhouette) ── */}
      <path
        d="
          M 20 49
          C 12 49 6 43 6 36
          C 6 28 10 22 12 19
          L 6 19 L 6 14
          L 12 14 L 12 2
          L 28 2 L 28 14
          L 34 14 L 34 19
          L 28 19
          C 30 22 34 28 34 36
          C 34 43 28 49 20 49 Z
        "
        fill="url(#prepiq-g)"
      />

      {/* ── Inner flame highlight (warm core) ── */}
      <path
        d="
          M 20 44
          C 16 44 13 40 13 36
          C 13 30 17 26 18 23
          C 19 26 20 27 20 25
          C 20 27 21 26 22 23
          C 23 26 27 30 27 36
          C 27 40 24 44 20 44 Z
        "
        fill="#fbbf24"
        opacity="0.18"
      />

      {/* ── Tassel cord ── */}
      <path
        d="M 28 3 C 32 8 36 14 36 22"
        stroke="url(#prepiq-tassel)"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Tassel end dot */}
      <circle cx="36" cy="22" r="2" fill="#f97316" />
    </svg>
  )
}

/** Icon + wordmark side by side. Use in nav headers. */
export function PrepIQWordmark({
  size = 32,
  className = "",
}: {
  size?: number
  className?: string
}) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <PrepIQLogo size={size} />
      <span
        className="font-black tracking-tight text-foreground"
        style={{ fontSize: Math.round(size * 0.56) }}
      >
        Prep<span className="text-primary">IQ</span>
      </span>
    </div>
  )
}
