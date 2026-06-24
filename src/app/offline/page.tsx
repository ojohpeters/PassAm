import { WifiOff } from "lucide-react"
import Link from "next/link"

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <WifiOff className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-black">You&apos;re offline</h1>
        <p className="max-w-xs text-sm text-muted-foreground leading-relaxed">
          Check your connection. If you were mid-exam, your answers are saved and will submit automatically when you reconnect.
        </p>
      </div>
      <Link
        href="/dashboard"
        className="rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground"
      >
        Go to Dashboard
      </Link>
    </div>
  )
}
