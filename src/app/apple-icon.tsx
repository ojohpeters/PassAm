import { ImageResponse } from "next/og"

export const runtime = "edge"
export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          background: "linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
        }}
      >
        {/* Graduation cap icon shape */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0,
          }}
        >
          {/* Diamond top */}
          <div
            style={{
              width: 72,
              height: 72,
              background: "rgba(255,255,255,0.95)",
              transform: "rotate(45deg)",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          />
        </div>
        <span
          style={{
            color: "white",
            fontFamily: "system-ui, sans-serif",
            fontWeight: 900,
            fontSize: 52,
            letterSpacing: "-2px",
            marginTop: -24,
          }}
        >
          PA
        </span>
      </div>
    ),
    { width: 180, height: 180 }
  )
}
