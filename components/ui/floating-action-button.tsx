// components/ui/floating-action-button.tsx
"use client"

import { motion } from "framer-motion"
import { Plus } from "lucide-react"
import Link from "next/link"

export function FloatingActionButton() {
  return (
    <Link href="/scan" passHref>
      <motion.button
        className="fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <Plus className="h-6 w-6" />
        <span className="sr-only">New Session</span>
      </motion.button>
    </Link>
  )
}
