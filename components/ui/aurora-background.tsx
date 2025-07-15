"use client"

import React, { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface AuroraBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  intensity?: 'subtle' | 'medium' | 'strong'
  animationSpeed?: 'slow' | 'medium' | 'fast'
  colorScheme?: 'aurora' | 'sunset' | 'ocean'
}

interface GradientPoint {
  x: number
  y: number
  xVel: number
  yVel: number
}

export function AuroraBackground({
  children,
  className,
  intensity = 'medium',
  animationSpeed = 'medium',
  colorScheme = 'aurora',
  ...props
}: AuroraBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Map intensity to opacity values
  const intensityMap = {
    subtle: 0.15,
    medium: 0.25,
    strong: 0.4,
  }
  
  // Map animation speed to values in seconds
  const speedMap = {
    slow: 0.15,
    medium: 0.25,
    fast: 0.35,
  }
  
  // Color schemes
  const colorSchemes = {
    aurora: ['#6DD5FA', '#C8B6FF', '#FFDDE1'],
    sunset: ['#FF9A8B', '#FF6A88', '#FF99AC'],
    ocean: ['#48c6ef', '#6f86d6', '#5FFBF1'],
  }
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Set canvas size to match parent
    const resizeCanvas = () => {
      const parent = canvas.parentElement
      if (parent) {
        canvas.width = parent.offsetWidth
        canvas.height = parent.offsetHeight
      }
    }
    
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    
    // Aurora animation variables
    const selectedColors = colorSchemes[colorScheme]
    const opacityValue = intensityMap[intensity]
    const speedValue = speedMap[animationSpeed]
    
    let time = 0
    
    // Create gradient points
    const gradientPoints: GradientPoint[] = []
    const numPoints = 5
    
    for (let i = 0; i < numPoints; i++) {
      gradientPoints.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        xVel: (Math.random() - 0.5) * speedValue,
        yVel: (Math.random() - 0.5) * speedValue,
      })
    }
    
    // Animation function
    const animate = () => {
      if (!ctx || !canvas) return
      
      time += 0.01
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Update gradient points
      gradientPoints.forEach(point => {
        point.x += point.xVel
        point.y += point.yVel
        
        // Bounce off edges
        if (point.x < 0 || point.x > canvas.width) point.xVel *= -1
        if (point.y < 0 || point.y > canvas.height) point.yVel *= -1
      })
      
      // Draw gradient blobs
      selectedColors.forEach((color, i) => {
        const index = i % gradientPoints.length
        const point = gradientPoints[index]
        
        // Create radial gradient
        const gradientSize = Math.min(canvas.width, canvas.height) * 0.8
        const gradient = ctx.createRadialGradient(
          point.x,
          point.y,
          0,
          point.x,
          point.y,
          gradientSize
        )
        
        gradient.addColorStop(0, `${color}${Math.floor(opacityValue * 255).toString(16).padStart(2, '0')}`)
        gradient.addColorStop(1, 'transparent')
        
        ctx.fillStyle = gradient
        ctx.globalCompositeOperation = 'lighter'
        ctx.beginPath()
        ctx.arc(point.x, point.y, gradientSize, 0, Math.PI * 2)
        ctx.fill()
      })
      
      requestAnimationFrame(animate)
    }
    
    animate()
    
    return () => {
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [intensity, animationSpeed, colorScheme])
  
  return (
    <div className={cn('relative overflow-hidden', className)} {...props}>
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 -z-10 opacity-${
          intensity === 'subtle' ? '15' : 
          intensity === 'medium' ? '25' : '40'
        }`}
      />
      {children}
    </div>
  )
}
