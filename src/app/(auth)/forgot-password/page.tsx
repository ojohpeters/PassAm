"use client"

import { useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { requestPasswordReset } from "@/actions/auth.actions"
import Link from "next/link"
import { Mail, ArrowRight, Loader2, CheckCircle2, ArrowLeft } from "lucide-react"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sent = searchParams.get("sent")

  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState("")
  const [email, setEmail] = useState("")

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    const fd = new FormData(e.currentTarget)
    const emailVal = (fd.get("email") as string)?.trim()
    startTransition(async () => {
      const res = await requestPasswordReset(fd)
      if (res?.error) { setError(res.error); return }
      router.push(`/forgot-password?sent=1&email=${encodeURIComponent(emailVal)}`)
    })
  }

  if (sent) {
    const displayEmail = searchParams.get("email") ?? email
    return (
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-black tracking-tight">Check your inbox</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            We sent a password reset link to{" "}
            {displayEmail && <span className="font-semibold text-foreground">{displayEmail}</span>}.
            Click it to set a new password — it expires in 1 hour.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Didn&apos;t get it? Check your spam folder or{" "}
          <button
            onClick={() => router.push("/forgot-password")}
            className="font-semibold text-primary hover:underline"
          >
            try again
          </button>.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight">Forgot password?</h1>
        <p className="text-muted-foreground text-sm">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold" htmlFor="email">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              id="email"
              name="email"
              type="email"
              required
              autoFocus
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border bg-muted/30 py-3 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20"
              placeholder="you@example.com"
            />
          </div>
        </div>

        {error && (
          <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 hover:shadow-lg hover:shadow-primary/30 disabled:opacity-60"
        >
          {isPending ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
          ) : (
            <>Send reset link <ArrowRight className="h-4 w-4" /></>
          )}
        </button>

        <p className="text-center text-sm text-muted-foreground">
          Remember it?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign in →
          </Link>
        </p>
      </form>
    </div>
  )
}
