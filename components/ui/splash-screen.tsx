"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Wallet, ArrowRight, Sparkles } from "lucide-react"

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [isVisible, setIsVisible] = useState(true)
  const [showText, setShowText] = useState(false)
  const [animationComplete, setAnimationComplete] = useState(false)

  useEffect(() => {
    // Show text after logo animation
    const textTimer = setTimeout(() => {
      setShowText(true)
    }, 1000)

    // Complete animation and hide splash screen
    const animTimer = setTimeout(() => {
      setAnimationComplete(true)
      setTimeout(() => {
        setIsVisible(false)
        setTimeout(onComplete, 500)
      }, 1000)
    }, 3000)

    return () => {
      clearTimeout(textTimer)
      clearTimeout(animTimer)
    }
  }, [onComplete])

  // Particles animation
  const particles = Array.from({ length: 20 }).map((_, i) => (
    <motion.div
      key={i}
      className="absolute w-2 h-2 rounded-full bg-purple-500/40"
      initial={{ 
        opacity: 0,
        x: 0,
        y: 0,
        scale: 0
      }}
      animate={animationComplete ? {
        opacity: [0.8, 0],
        x: [0, (Math.random() - 0.5) * 100],
        y: [0, (Math.random() - 0.5) * 100],
        scale: [0.4, 2]
      } : {}}
      transition={{ 
        duration: 1.5, 
        ease: "easeOut",
        delay: i * 0.02
      }}
    />
  ))

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black"
        >
          <div className="absolute inset-0 overflow-hidden z-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.15),transparent_60%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.1),transparent_70%)]"></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(6,182,212,0.1),transparent_70%)]"></div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 z-0"
          >
            {/* Background animation dots */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(100)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white/20 rounded-full"
                  initial={{ 
                    x: typeof window !== 'undefined' ? Math.random() * window.innerWidth : Math.random() * 1000, 
                    y: typeof window !== 'undefined' ? Math.random() * window.innerHeight : Math.random() * 1000,
                    opacity: Math.random() * 0.5 + 0.3
                  }}
                  animate={{
                    opacity: [null, 0.2, 0.8, 0.2],
                  }}
                  transition={{
                    duration: Math.random() * 5 + 5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  style={{
                    scale: Math.random() * 2 + 0.2
                  }}
                />
              ))}
            </div>
          </motion.div>

          <div className="relative z-10 text-center">
            <div className="relative mb-8">
              {/* Main Logo with Glow */}
              <motion.div
                className="w-24 h-24 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(139,92,246,0.7)]"
                initial={{ rotate: 0, scale: 0.5 }}
                animate={{ 
                  rotate: animationComplete ? [0, 90, 180, 270, 360] : 0,
                  scale: 1
                }}
                transition={{
                  duration: animationComplete ? 0.8 : 0.5,
                  ease: "easeInOut",
                  scale: { type: "spring", stiffness: 200, damping: 15 }
                }}
              >
                <Wallet className="h-12 w-12 text-white" />
              </motion.div>
              
              {/* Particles that appear when animation completes */}
              <div className="absolute inset-0 flex items-center justify-center">
                {particles}
              </div>
              
              {/* Orbital ring */}
              <motion.div
                className="absolute top-1/2 left-1/2 w-36 h-36 border border-purple-500/30 rounded-full -translate-x-1/2 -translate-y-1/2"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0.8, 1.5]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeOut"
                }}
              />
              
              <motion.div
                className="absolute top-1/2 left-1/2 w-32 h-32 border border-cyan-500/20 rounded-full -translate-x-1/2 -translate-y-1/2"
                initial={{ opacity: 0, scale: 0.5, rotate: 45 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [1, 2],
                  rotate: [45, 225]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: 0.5
                }}
              />
            </div>

            {/* Text Animation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: showText ? 1 : 0, y: showText ? 0 : 20 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.h1 
                className="text-4xl font-bold text-white mb-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: showText ? 1 : 0, y: showText ? 0 : 10 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Patungan
              </motion.h1>
              
              <motion.div
                className="text-lg text-gray-300 flex items-center justify-center gap-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: showText ? 1 : 0, y: showText ? 0 : 10 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <span>Split Bill With Friends</span>
                <Sparkles className="h-4 w-4 text-yellow-300" />
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
