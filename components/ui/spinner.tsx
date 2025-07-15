"use client"

import React from "react"
import { cn } from "@/lib/utils"

interface CircleSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export function CircleSpinner({ size = "md", className }: CircleSpinnerProps) {
  return (
    <div
      className={cn(
        "inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]",
        {
          "h-4 w-4 border-2": size === "sm",
          "h-8 w-8 border-3": size === "md",
          "h-12 w-12 border-4": size === "lg",
        },
        "text-primary/70",
        className
      )}
      role="status"
    >
      <span className="sr-only">Loading...</span>
    </div>
  )
}
