// Apple-inspired Design System
export const designSystem = {
  colors: {
    // Primary palette inspired by Apple's design
    primary: {
      50: "#f0f9ff",
      100: "#e0f2fe",
      200: "#bae6fd",
      300: "#7dd3fc",
      400: "#38bdf8",
      500: "#0ea5e9",
      600: "#0284c7",
      700: "#0369a1",
      800: "#075985",
      900: "#0c4a6e",
    },

    // Glass morphism colors
    glass: {
      light: "rgba(255, 255, 255, 0.1)",
      medium: "rgba(255, 255, 255, 0.2)",
      dark: "rgba(0, 0, 0, 0.1)",
      border: "rgba(255, 255, 255, 0.2)",
    },

    // Semantic colors
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#3b82f6",
  },

  // Apple-style spacing
  spacing: {
    xs: "0.25rem", // 4px
    sm: "0.5rem", // 8px
    md: "1rem", // 16px
    lg: "1.5rem", // 24px
    xl: "2rem", // 32px
    "2xl": "3rem", // 48px
    "3xl": "4rem", // 64px
  },

  // Apple-style border radius
  borderRadius: {
    sm: "0.5rem", // 8px
    md: "0.75rem", // 12px
    lg: "1rem", // 16px
    xl: "1.5rem", // 24px
    "2xl": "2rem", // 32px
    full: "9999px",
  },

  // Apple-style shadows
  shadows: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    glass: "0 8px 32px 0 rgba(31, 38, 135, 0.37)",
  },

  // Typography scale
  typography: {
    xs: "0.75rem", // 12px
    sm: "0.875rem", // 14px
    base: "1rem", // 16px
    lg: "1.125rem", // 18px
    xl: "1.25rem", // 20px
    "2xl": "1.5rem", // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem", // 36px
    "5xl": "3rem", // 48px
  },
} as const

// Animation presets
export const animations = {
  spring: {
    type: "spring",
    stiffness: 300,
    damping: 30,
  },
  smooth: {
    duration: 0.3,
    ease: [0.4, 0.0, 0.2, 1],
  },
  bounce: {
    type: "spring",
    stiffness: 400,
    damping: 10,
  },
} as const

// This file can be used for design tokens, typography, etc.
// For now, it's empty as per the previous context.
