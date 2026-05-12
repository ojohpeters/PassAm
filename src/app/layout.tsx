import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"
import { Suspense } from "react"
import { NavigationProgress } from "@/components/shared/NavigationProgress"
import { ChunkErrorHandler } from "@/components/shared/ChunkErrorHandler"

const inter = Inter({ subsets: ["latin"] })

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://passam.vercel.app"

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "PrepIQ — Practise like it's real. Pass like it's easy.",
    template: "%s | PrepIQ",
  },
  description:
    "School-specific CBT practice for Nigerian POST-UTME. 1,000+ past questions, timed mock exams, daily quiz & leaderboard. Free forever.",
  keywords: [
    "POST-UTME",
    "UTME",
    "Nigeria",
    "CBT practice",
    "UNILAG",
    "OAU",
    "UI",
    "UNIBEN",
    "UNIPORT",
    "AFIT",
    "university entrance exam",
    "mock exam",
    "past questions",
  ],
  authors: [{ name: "PrepIQ" }],
  creator: "PrepIQ",
  openGraph: {
    type: "website",
    url: APP_URL,
    siteName: "PrepIQ",
    title: "PrepIQ — Pass Your POST-UTME",
    description:
      "School-specific CBT mock exams for Nigerian students. 1,000+ past questions, daily quiz, weekly leaderboard. Free forever 🇳🇬",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "PrepIQ — Pass Your POST-UTME",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PrepIQ — Pass Your POST-UTME",
    description:
      "School-specific CBT practice for Nigerian students. Free mock exams, daily quiz & leaderboard 🇳🇬",
    images: ["/opengraph-image"],
    creator: "@prepiq_ng",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ChunkErrorHandler />
        <Suspense>
          <NavigationProgress />
        </Suspense>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
