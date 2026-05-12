"use client"

import { useState, useTransition } from "react"
import { submitSchoolRequest } from "@/actions/school.actions"
import { toast } from "sonner"
import { Loader2, Send, CheckCircle2, Globe } from "lucide-react"
import Link from "next/link"

export default function RequestSchoolPage() {
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [schoolName, setSchoolName] = useState("")
  const [message, setMessage] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!schoolName.trim()) return
    startTransition(async () => {
      const result = await submitSchoolRequest(schoolName, message)
      if (result.success) {
        setDone(true)
      } else {
        toast.error(result.error)
      }
    })
  }

  if (done) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-6 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950/40">
          <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="mt-5 text-2xl font-black">We got it! 🎉</h1>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Thanks for letting us know. We&apos;ll work on adding{" "}
          <span className="font-semibold text-foreground">{schoolName}</span> soon.
          In the meantime, use the General Practice exam to keep your prep going!
        </p>
        <div className="mt-6 flex flex-col gap-3 w-full max-w-xs">
          <Link
            href="/exam/general"
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground shadow transition-all hover:opacity-90 active:scale-[0.98]"
          >
            <Globe className="h-4 w-4" />
            Start General Practice Exam
          </Link>
          <Link
            href="/dashboard"
            className="rounded-2xl border px-6 py-3.5 text-sm font-semibold text-center transition-colors hover:bg-muted"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-background">

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#1a3a7c] to-[#0d2254] px-5 py-10 text-white">
        <div className="mx-auto max-w-lg">
          <p className="text-4xl mb-3">🏫</p>
          <h1 className="text-2xl font-black tracking-tight">Your School Not Listed?</h1>
          <p className="mt-2 text-sm leading-relaxed text-white/75">
            Don&apos;t panic — we&apos;re expanding fast! Tell us your school and we&apos;ll prioritise adding it.
            While you wait, you can still practice with our General Exam.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-8 md:px-6">

        {/* General exam CTA */}
        <Link
          href="/exam/general"
          className="mb-8 flex items-center gap-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 transition-all hover:border-primary/40 hover:bg-primary/10 active:scale-[0.99]"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm">Start General Practice Exam now</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Questions sourced from all available schools — keep grinding!
            </p>
          </div>
          <span className="shrink-0 text-xs font-bold text-primary">Go →</span>
        </Link>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              School Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="e.g. University of Calabar (UNICAL)"
              maxLength={200}
              required
              className="w-full rounded-xl border bg-background px-4 py-3 text-sm font-medium outline-none ring-primary/40 transition-all focus:border-primary focus:ring-2 placeholder:text-muted-foreground placeholder:font-normal"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Anything else? <span className="text-muted-foreground font-normal">(optional)</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. I'm writing POST-UTME for this school in July. Please add Biology and Chemistry questions."
              maxLength={500}
              rows={3}
              className="w-full resize-none rounded-xl border bg-background px-4 py-3 text-sm outline-none ring-primary/40 transition-all focus:border-primary focus:ring-2 placeholder:text-muted-foreground"
            />
          </div>

          <button
            type="submit"
            disabled={isPending || !schoolName.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-sm font-black text-primary-foreground shadow transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
          >
            {isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
            ) : (
              <><Send className="h-4 w-4" /> Submit School Request</>
            )}
          </button>

          <p className="text-center text-xs text-muted-foreground">
            We read every submission. Your request will be attended to asap. 🙏
          </p>
        </form>

      </div>
    </div>
  )
}
