"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const BorderBeam = ({
  className,
  size = 200,
  duration = 15,
  borderWidth = 1.5,
  anchor = 90,
  colorFrom = "#ffaa40",
  colorTo = "#9c40ff",
  delay = 0,
}: {
  className?: string;
  size?: number;
  duration?: number;
  borderWidth?: number;
  anchor?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
}) => {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] [border:calc(var(--border-width)*1px)_solid_transparent]",
        "[background:linear-gradient(calc(var(--angle)*1deg),transparent_20%,var(--color-from)_50%,var(--color-to)_70%,transparent_80%)_border-box]",
        "[mask:linear-gradient(#fff_0_0)_padding-box,linear-gradient(#fff_0_0)]",
        "[mask-composite:exclude]",
        className
      )}
      style={
        {
          "--border-width": borderWidth,
          "--angle": anchor,
          "--color-from": colorFrom,
          "--color-to": colorTo,
        } as React.CSSProperties
      }
    >
      <motion.div
        className="absolute inset-0 rounded-[inherit] border border-transparent [background:linear-gradient(calc(var(--angle)*1deg),transparent_20%,var(--color-from)_50%,var(--color-to)_70%,transparent_80%)_border-box] [mask:linear-gradient(#fff_0_0)_padding-box,linear-gradient(#fff_0_0)] [mask-composite:exclude]"
        animate={{
          "--angle": [anchor, anchor + 360],
        }}
        transition={{
          duration,
          ease: "linear",
          repeat: Infinity,
          delay,
        }}
        style={
          {
            "--angle": anchor,
            "--color-from": colorFrom,
            "--color-to": colorTo,
          } as React.CSSProperties
        }
      />
    </div>
  );
};
