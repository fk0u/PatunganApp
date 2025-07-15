// components/ui/glass-card.tsx
import type * as React from "react"
import { cn } from "@/lib/utils"

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  variant?: 'light' | 'medium' | 'heavy' | 'frost'
  colorAccent?: 'purple' | 'blue' | 'cyan' | 'none'
  glowEffect?: boolean
  floatAnimation?: boolean
}

export function GlassCard({ 
  className, 
  hover = true, 
  variant = 'medium',
  colorAccent = 'none',
  glowEffect = false,
  floatAnimation = false,
  ...props 
}: GlassCardProps) {
  
  // Base glass styles
  const glassVariants = {
    light: "bg-white/60 backdrop-blur-md border border-white/30 shadow-sm",
    medium: "bg-white/50 backdrop-blur-xl border border-white/40 shadow-md",
    heavy: "bg-white/40 backdrop-blur-2xl border border-white/50 shadow-lg",
    frost: "bg-white/30 backdrop-blur-3xl border border-white/60 shadow-xl"
  }
  
  // Color accent styles
  const accentStyles = {
    none: "",
    purple: "border-purple-200/50",
    blue: "border-blue-200/50",
    cyan: "border-cyan-200/50"
  }

  // Glow effect based on color accent
  const glowStyles = {
    none: "",
    purple: "shadow-[0_0_15px_rgba(139,92,246,0.3)]",
    blue: "shadow-[0_0_15px_rgba(96,165,250,0.3)]",
    cyan: "shadow-[0_0_15px_rgba(34,211,238,0.3)]"
  }
  
  return (
    <div
      className={cn(
        "rounded-2xl", 
        glassVariants[variant],
        accentStyles[colorAccent],
        hover && "transition-all duration-300 hover:scale-[1.01] hover:shadow-md hover:bg-white/50",
        glowEffect && colorAccent !== 'none' && glowStyles[colorAccent],
        glowEffect && colorAccent === 'none' && "shadow-[0_0_15px_rgba(255,255,255,0.1)]",
        floatAnimation && "animate-float",
        className
      )}
      {...props}
    />
  )
}
