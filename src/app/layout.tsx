import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "sonner"
import { Suspense } from "react"
import { NavigationProgress } from "@/components/shared/NavigationProgress"

const inter = Inter({ subsets: ["latin"] })

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://passam.vercel.app"

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "PassAm — Pass Your POST-UTME",
    template: "%s | PassAm",
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
  authors: [{ name: "PassAm" }],
  creator: "PassAm",
  openGraph: {
    type: "website",
    url: APP_URL,
    siteName: "PassAm",
    title: "PassAm — Pass Your POST-UTME",
    description:
      "School-specific CBT mock exams for Nigerian students. 1,000+ past questions, daily quiz, weekly leaderboard. Free forever 🇳🇬",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "PassAm — Pass Your POST-UTME",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PassAm — Pass Your POST-UTME",
    description:
      "School-specific CBT practice for Nigerian students. Free mock exams, daily quiz & leaderboard 🇳🇬",
    images: ["/opengraph-image"],
    creator: "@passam_ng",
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
        <Suspense>
          <NavigationProgress />
        </Suspense>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
