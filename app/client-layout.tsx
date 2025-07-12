"use client"

import type React from "react"

import { motion } from "framer-motion"
import { MobileNavbar } from "@/components/ui/mobile-navbar"
import { BackgroundPattern } from "@/components/ui/background-pattern"
import { SplashScreen } from "@/components/ui/splash-screen"
import { useState, useEffect } from "react"

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 2500)

    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return <SplashScreen onComplete={() => setLoading(false)} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 relative overflow-hidden">
      <BackgroundPattern />
      {/* Adjusted pt-28 to create more space for the sticky top navbar */}
      <main className="relative z-10 pt-28 pb-24 px-4 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </main>
      <MobileNavbar />
    </div>
  )
}
