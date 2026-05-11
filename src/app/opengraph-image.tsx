import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "PassAm — Pass Your POST-UTME"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#050d1f",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Gradient accent bar at top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 5,
            background: "linear-gradient(90deg, #3b82f6 0%, #6366f1 50%, #8b5cf6 100%)",
          }}
        />

        {/* Background glow orbs */}
        <div
          style={{
            position: "absolute",
            top: -160,
            right: -160,
            width: 520,
            height: 520,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: 80,
            width: 380,
            height: 380,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)",
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: "60px 90px",
            justifyContent: "space-between",
          }}
        >
          {/* Top: Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: 900,
                fontSize: 22,
                fontFamily: "system-ui, sans-serif",
                letterSpacing: "-0.5px",
              }}
            >
              PA
            </div>
            <span
              style={{
                color: "white",
                fontWeight: 900,
                fontSize: 32,
                fontFamily: "system-ui, sans-serif",
                letterSpacing: "-1px",
              }}
            >
              PassAm
            </span>
            <div
              style={{
                marginLeft: 8,
                background: "rgba(59,130,246,0.2)",
                border: "1px solid rgba(59,130,246,0.4)",
                borderRadius: 100,
                padding: "4px 14px",
                color: "#93c5fd",
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              🇳🇬 Free Forever
            </div>
          </div>

          {/* Middle: Headline */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div
              style={{
                fontSize: 82,
                fontWeight: 900,
                color: "white",
                lineHeight: 1.0,
                letterSpacing: "-3px",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              Pass Your
            </div>
            <div
              style={{
                fontSize: 82,
                fontWeight: 900,
                lineHeight: 1.0,
                letterSpacing: "-3px",
                fontFamily: "system-ui, sans-serif",
                background: "linear-gradient(90deg, #60a5fa, #818cf8)",
                color: "transparent",
                // Satori workaround: use color directly
              }}
            >
              <span style={{ color: "#60a5fa" }}>POST-UTME.</span>
            </div>
            <div
              style={{
                fontSize: 26,
                color: "rgba(255,255,255,0.55)",
                marginTop: 8,
                fontFamily: "system-ui, sans-serif",
                fontWeight: 500,
              }}
            >
              School-specific CBT practice for Nigerian students
            </div>
          </div>

          {/* Bottom: Feature badges */}
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            {[
              "📚  1,000+ Past Questions",
              "🏫  6+ Schools",
              "🔥  Daily Quiz",
              "🏆  Leaderboard",
            ].map((badge) => (
              <div
                key={badge}
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 100,
                  padding: "10px 22px",
                  color: "rgba(255,255,255,0.75)",
                  fontSize: 18,
                  fontWeight: 600,
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                {badge}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
