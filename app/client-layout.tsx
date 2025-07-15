"use client"

import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { motion } from "framer-motion"
import { BackgroundPattern } from "@/components/ui/background-pattern"
import { SplashScreen } from "@/components/ui/splash-screen"
import { useState, useEffect } from "react"
import { AuthProvider } from "@/contexts/AuthContext"
import { GroupProvider } from "@/contexts/GroupContext"
import { SubscriptionProvider } from "@/contexts/SubscriptionContext"
import { SessionProvider } from "@/contexts/SessionContext"
import { ChatProvider } from "@/contexts/ChatContext"
import { Toaster } from "@/components/ui/sonner"

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
    <AuthProvider>
      <GroupProvider>
        <SubscriptionProvider>
          <SessionProvider>
            <ChatProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                {children}
                <Toaster />
              </ThemeProvider>
            </ChatProvider>
          </SessionProvider>
        </SubscriptionProvider>
      </GroupProvider>
    </AuthProvider>
  )
}
