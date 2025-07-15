"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GlassCard } from "@/components/ui/glass-card"
import { Home, Menu, X, Sparkles, BarChart2, Info, MessageSquareText, Users, PlusCircle, CreditCard } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

export function MobileNavbar({ className }: { className?: string }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const pathname = usePathname()
  const { userData, currentUser, logout } = useAuth()

  const menuItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/dashboard", icon: Users, label: "My Groups", requireAuth: true },
    { href: "/subscriptions", icon: CreditCard, label: "Subscriptions", requireAuth: true },
    { href: "/local-session", icon: PlusCircle, label: "Quick Split" },
    { href: "/report", icon: BarChart2, label: "Expenses" },
    { href: "/chat", icon: MessageSquareText, label: "AI Chat" },
    { href: "/about", icon: Info, label: "About" },
  ]

  const handleLogout = async () => {
    try {
      await logout();
      setIsMenuOpen(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <>
      {/* Top Navigation Bar */}
      <motion.nav
        className={cn("fixed top-0 left-0 right-0 z-50 px-4 pt-safe-top", className)}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <GlassCard className="w-full rounded-none rounded-b-2xl px-4 py-4 shadow-lg" variant="elevated">
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

            {/* User Avatar or Menu Button */}
            {currentUser ? (
              <Avatar
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="cursor-pointer border-2 border-white/20"
              >
                <AvatarImage src={userData?.photoURL || ""} />
                <AvatarFallback>
                  {userData?.displayName?.substring(0, 2) || currentUser.email?.substring(0, 2) || "U"}
                </AvatarFallback>
              </Avatar>
            ) : (
              <motion.button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 rounded-xl bg-white/10 border border-white/20"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Menu className="w-6 h-6 text-gray-700 dark:text-gray-200" />
              </motion.button>
            )}
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
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Menu</h2>
                    <motion.button
                      onClick={() => setIsMenuOpen(false)}
                      className="p-2 rounded-xl bg-white/10 border border-white/20"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </motion.button>
                  </div>

                  {/* User Profile Section (if logged in) */}
                  {currentUser && (
                    <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-3 mb-4">
                        <Avatar>
                          <AvatarImage src={userData?.photoURL || ""} />
                          <AvatarFallback>
                            {userData?.displayName?.substring(0, 2) || currentUser.email?.substring(0, 2) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{userData?.displayName || currentUser.email}</p>
                          <p className="text-xs text-muted-foreground">{currentUser.email}</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        size="sm"
                        onClick={handleLogout}
                      >
                        Sign Out
                      </Button>
                    </div>
                  )}

                  <div className="flex-1 space-y-2">
                    {menuItems
                      .filter(item => !item.requireAuth || currentUser)
                      .map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href
                        return (
                          <Link key={item.href} href={item.href} onClick={() => setIsMenuOpen(false)}>
                            <motion.div
                              className={cn(
                                "flex items-center space-x-3 p-4 rounded-xl transition-colors",
                                isActive 
                                  ? "bg-primary/10 text-primary" 
                                  : "hover:bg-white/10 text-gray-700 dark:text-gray-300"
                              )}
                              whileHover={{ x: 4 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Icon className="w-5 h-5" />
                              <span className="font-medium">{item.label}</span>
                            </motion.div>
                          </Link>
                        )
                      })
                    }
                    
                    {/* Auth Link (if not logged in) */}
                    {!currentUser && (
                      <Link href="/auth" onClick={() => setIsMenuOpen(false)}>
                        <motion.div
                          className="flex items-center space-x-3 p-4 mt-4 rounded-xl bg-primary text-white"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <span className="font-medium">Sign In / Sign Up</span>
                        </motion.div>
                      </Link>
                    )}
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
