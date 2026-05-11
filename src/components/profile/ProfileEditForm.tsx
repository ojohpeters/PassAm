"use client"

import { useRef, useState, useTransition } from "react"
import { updateProfile, uploadAvatar } from "@/actions/profile.actions"
import { signOutAction } from "@/actions/auth.actions"
import { toast } from "sonner"
import { Camera, Loader2, LogOut, Save } from "lucide-react"
import { cn } from "@/lib/utils"

type Props = {
  userId: string
  name: string
  bio: string | null
  targetSchool: string | null
  avatarUrl: string | null
  schools: { id: string; name: string; abbreviation: string }[]
  initials: string
}

export function ProfileEditForm({ userId, name, bio, targetSchool, avatarUrl, schools, initials }: Props) {
  const [preview, setPreview] = useState<string | null>(avatarUrl)
  const [bioLen, setBioLen] = useState(bio?.length ?? 0)
  const [uploading, setUploading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Instant local preview
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)

    setUploading(true)
    const fd = new FormData()
    fd.append("avatar", file)
    const result = await uploadAvatar(fd)
    setUploading(false)

    if (result.success) {
      toast.success("Profile photo updated!")
    } else {
      toast.error(result.error)
      setPreview(avatarUrl)
    }
  }

  function handleSave(formData: FormData) {
    startTransition(async () => {
      const result = await updateProfile(formData)
      if (result.success) {
        toast.success("Profile saved!")
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <div className="space-y-6">

      {/* ── Avatar upload ── */}
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-primary to-indigo-600 text-2xl font-black text-white shadow-lg ring-4 ring-background transition-all duration-200 hover:ring-primary/30 active:scale-95"
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              <span>{initials}</span>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              {uploading
                ? <Loader2 className="h-6 w-6 animate-spin text-white" />
                : <Camera className="h-6 w-6 text-white" />
              }
            </div>
          </button>
          {uploading && (
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow">
              <Loader2 className="h-3 w-3 animate-spin" />
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Tap to change photo · Max 2 MB</p>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleAvatarChange}
        />
      </div>

      {/* ── Profile fields ── */}
      <form action={handleSave} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Display Name
          </label>
          <input
            name="name"
            defaultValue={name}
            maxLength={60}
            required
            placeholder="Your full name"
            className="w-full rounded-xl border bg-background px-4 py-3 text-sm font-medium outline-none ring-primary/40 transition-all focus:border-primary focus:ring-2"
          />
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Bio</span>
            <span className={cn("tabular-nums", bioLen > 140 ? "text-rose-500" : "")}>
              {bioLen}/160
            </span>
          </label>
          <textarea
            name="bio"
            defaultValue={bio ?? ""}
            maxLength={160}
            rows={3}
            placeholder="What's your story? Targets, motivation, goals…"
            onChange={(e) => setBioLen(e.target.value.length)}
            className="w-full resize-none rounded-xl border bg-background px-4 py-3 text-sm outline-none ring-primary/40 transition-all focus:border-primary focus:ring-2"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Target School
          </label>
          <select
            name="target_school"
            defaultValue={targetSchool ?? ""}
            className="w-full rounded-xl border bg-background px-4 py-3 text-sm font-medium outline-none ring-primary/40 transition-all focus:border-primary focus:ring-2"
          >
            <option value="">— Select your target school —</option>
            {schools.map((s) => (
              <option key={s.id} value={s.abbreviation}>
                {s.name} ({s.abbreviation})
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow transition-all duration-150 hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isPending ? "Saving…" : "Save Changes"}
        </button>
      </form>

      {/* ── Sign out ── */}
      <div className="pt-2">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Account
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-rose-200 bg-rose-50 py-3 text-sm font-bold text-rose-600 transition-all duration-150 hover:bg-rose-100 active:scale-[0.98] dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400 dark:hover:bg-rose-950/50"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </form>
      </div>

    </div>
  )
}
