"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GlassCard } from "@/components/ui/glass-card"
import { Home, Menu, X, Sparkles, BarChart2, Info, MessageSquareText } from "lucide-react" // Added MessageSquareText for AI Chat icon
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function MobileNavbar({ className }: { className?: string }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()

  const menuItems = [
    { href: "/", icon: Home, label: "Beranda" },
    { href: "/report", icon: BarChart2, label: "Laporan Pengeluaran" },
    { href: "/chat", icon: MessageSquareText, label: "AI Chat" }, // New link for AI Chat page
    { href: "/about", icon: Info, label: "Tentang Kami" },
  ]

  return (
    <>
      {/* Top Navigation Bar - Now the primary mobile navigation and sticky header */}
      <motion.nav
        className={cn("fixed top-0 left-0 right-0 z-40 px-4 pt-safe-top", className)}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <GlassCard className="w-full rounded-none rounded-b-2xl px-4 py-4" variant="elevated">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <motion.div
                className="w-8 h-8 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <Sparkles className="h-4 w-4 text-white" />
              </motion.div>
              <span className="text-lg font-bold handwriting-font bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
                Patungan
              </span>
            </Link>

            {/* Menu Button */}
            <motion.button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-xl bg-white/10 border border-white/20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Menu className="w-6 h-6 text-gray-700" />
            </motion.button>
          </div>
        </GlassCard>
      </motion.nav>

      {/* Slide-out Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              className="fixed top-0 right-0 bottom-0 z-50 w-80 max-w-[85vw]"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <GlassCard className="h-full rounded-l-3xl rounded-r-none border-r-0" variant="elevated">
                <div className="p-6 h-full flex flex-col">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-gray-800">Menu</h2>
                    <motion.button
                      onClick={() => setIsMenuOpen(false)}
                      className="p-2 rounded-xl bg-white/10 border border-white/20"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <X className="w-5 h-5 text-gray-600" />
                    </motion.button>
                  </div>

                  <div className="flex-1 space-y-2">
                    {menuItems.map((item) => {
                      const Icon = item.icon
                      return (
                        <Link key={item.href} href={item.href} onClick={() => setIsMenuOpen(false)}>
                          <motion.div
                            className="flex items-center space-x-3 p-4 rounded-xl hover:bg-white/10 transition-colors"
                            whileHover={{ x: 4 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <Icon className="w-5 h-5 text-gray-600" />
                            <span className="font-medium text-gray-700">{item.label}</span>
                          </motion.div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
