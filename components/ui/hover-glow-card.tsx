"use client";

import React, { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BorderBeam } from "./border-beam";

interface HoverGlowCardProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  beamColor1?: string;
  beamColor2?: string;
  beamDuration?: number;
  animate?: boolean;
  animationDelay?: number;
}

export const HoverGlowCard = ({
  children,
  onClick,
  className,
  beamColor1 = "#8b5cf6", // Purple default
  beamColor2 = "#06b6d4", // Cyan default
  beamDuration = 8,
  animate = true,
  animationDelay = 0,
}: HoverGlowCardProps) => {
  const MotionWrapper = animate ? motion.div : React.Fragment;
  
  const animationProps = animate 
    ? {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { delay: animationDelay }
      } 
    : {};
  
  return (
    <MotionWrapper {...animationProps}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "relative p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl",
          "hover:bg-white/10 transition-all cursor-pointer group overflow-hidden",
          className
        )}
        onClick={onClick}
      >
        {children}
        <BorderBeam
          className="rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
          colorFrom={beamColor1}
          colorTo={beamColor2}
          duration={beamDuration}
        />
      </motion.div>
    </MotionWrapper>
  );
};
