// components/ui/glass-card.tsx
import type * as React from "react"
import { cn } from "@/lib/utils"

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean
}

export function GlassCard({ className, hover, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-gray-100 bg-white/50 shadow-lg backdrop-blur-xl",
        hover && "transition-all duration-200 hover:scale-[1.01] hover:shadow-xl",
        className,
      )}
      {...props}
    />
  )
}
