import { createAdminClient } from "@/lib/supabase/admin"
import { getAppUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { ImportClient } from "./ImportClient"

export default async function ImportQuestionsPage() {
  const user = await getAppUser()
  if (!user || user.role !== "ADMIN") redirect("/dashboard")

  const admin = createAdminClient()
  const { data: schools } = await admin
    .from("schools")
    .select("id, name, abbreviation")
    .neq("abbreviation", "GENERAL")
    .order("name")

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Bulk Import Questions</h1>
        <p className="text-sm text-muted-foreground">
          Paste CSV text from AI extraction — preview, then import in one click.
        </p>
      </div>

      <div className="rounded-2xl border bg-muted/30 px-4 py-3 text-sm text-muted-foreground space-y-1">
        <p><strong className="text-foreground">Expected columns (no header row needed):</strong></p>
        <code className="block text-xs bg-background rounded-lg px-3 py-2 border font-mono leading-relaxed">
          text, option_a, option_b, option_c, option_d, correct, explanation, subject, year
        </code>
        <p className="text-xs">
          <strong className="text-foreground">correct</strong> = A / B / C / D &nbsp;·&nbsp;
          <strong className="text-foreground">year</strong> is optional &nbsp;·&nbsp;
          Wrap fields with commas in double quotes
        </p>
      </div>

      <ImportClient schools={schools ?? []} />
    </div>
  )
}
