import { Suspense } from "react"
import { LoginForm } from "@/components/auth/LoginForm"

export const dynamic = "force-dynamic"

export default function LoginPage() {
  return (
    <div className="w-full max-w-md space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight">Welcome back 👋</h1>
        <p className="text-muted-foreground">
          Sign in and pick up where you left off.
        </p>
      </div>
      <Suspense fallback={<div className="h-56 animate-pulse rounded-2xl bg-muted" />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
