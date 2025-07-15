"use client";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const BackgroundBeams = ({ className }: { className?: string }) => {
  const paths = [
    "M100,0 Q150,50 100,100 T100,200",
    "M200,0 Q250,50 200,100 T200,200", 
    "M300,0 Q350,50 300,100 T300,200",
    "M400,0 Q450,50 400,100 T400,200",
    "M500,0 Q550,50 500,100 T500,200",
  ];

  return (
    <div
      className={cn(
        "absolute inset-0 h-full w-full bg-gradient-to-b from-blue-900/5 via-purple-900/5 to-cyan-900/5 overflow-hidden",
        className
      )}
    >
      <svg
        className="absolute h-full w-full"
        viewBox="0 0 600 400"
        preserveAspectRatio="none"
      >
        {paths.map((path, index) => (
          <motion.path
            key={`path-${index}`}
            d={path}
            stroke={`url(#gradient-${index})`}
            strokeWidth="2"
            fill="none"
            strokeOpacity="0.4"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              duration: 2,
              delay: index * 0.3,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          />
        ))}
        <defs>
          {paths.map((_, index) => (
            <linearGradient
              key={`gradient-${index}`}
              id={`gradient-${index}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop
                offset="0%"
                stopColor="#3b82f6"
                stopOpacity="0"
              />
              <stop
                offset="50%"
                stopColor="#8b5cf6"
                stopOpacity="1"
              />
              <stop
                offset="100%"
                stopColor="#06b6d4"
                stopOpacity="0"
              />
            </linearGradient>
          ))}
        </defs>
      </svg>
    </div>
  );
};
