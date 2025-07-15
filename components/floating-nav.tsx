"use client"

import React from "react"
import { motion } from "framer-motion"

interface FloatingNavWrapperProps {
  children: React.ReactNode
}

export function FloatingNavWrapper({ children }: FloatingNavWrapperProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 pb-6 pointer-events-none z-50">
      {children}
    </div>
  )
}

interface FloatingNavProps {
  children: React.ReactNode
}

export function FloatingNav({ children }: FloatingNavProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="flex justify-center pointer-events-auto"
    >
      <div className="bg-white shadow-lg rounded-full px-2 py-2">
        {children}
      </div>
    </motion.div>
  )
}
