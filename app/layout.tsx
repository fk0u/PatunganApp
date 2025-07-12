import type React from "react"
// app/layout.tsx
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import ClientLayout from "./client-layout"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Patungan - Social Finance Hub",
  description: "Your Social Finance Hub for easy bill splitting and expense tracking.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Patungan",
    startupImage: [
      "/icon-192.png", // Example, you might want to generate proper splash screens
    ],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Patungan",
    title: "Patungan - Social Finance Hub",
    description: "Your Social Finance Hub for easy bill splitting and expense tracking.",
    images: "/icon-512.png",
  },
  twitter: {
    card: "summary_large_image",
    title: "Patungan - Social Finance Hub",
    description: "Your Social Finance Hub for easy bill splitting and expense tracking.",
    images: "/icon-512.png",
  },
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
