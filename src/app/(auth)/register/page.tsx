import { RegisterForm } from "@/components/auth/RegisterForm"

export default function RegisterPage() {
  return (
    <div className="w-full max-w-md space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight">Create your account ✍️</h1>
        <p className="text-muted-foreground">
          Free forever. No credit card. Start practising in 30 seconds.
        </p>
      </div>
      <RegisterForm />
    </div>
  )
}
