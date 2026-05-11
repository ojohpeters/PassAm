import { redirect } from "next/navigation"

// Payment not yet implemented — redirect away
export default function UpgradePage() {
  redirect("/dashboard")
}
