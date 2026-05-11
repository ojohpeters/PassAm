import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"
import { Suspense } from "react"
import { NavigationProgress } from "@/components/shared/NavigationProgress"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PassAm — POST-UTME Practice",
  description: "CBT practice platform for Nigerian university entrance exams",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Suspense>
          <NavigationProgress />
        </Suspense>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
