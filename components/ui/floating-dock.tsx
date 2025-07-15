"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const FloatingDock = ({
  items,
  desktopClassName,
  mobileClassName,
}: {
  items: { title: string; icon: React.ReactNode; href?: string; onClick?: () => void }[];
  desktopClassName?: string;
  mobileClassName?: string;
}) => {
  return (
    <>
      <FloatingDockDesktop items={items} className={desktopClassName} />
      <FloatingDockMobile items={items} className={mobileClassName} />
    </>
  );
};

const FloatingDockMobile = ({
  items,
  className,
}: {
  items: { title: string; icon: React.ReactNode; href?: string; onClick?: () => void }[];
  className?: string;
}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("relative block md:hidden", className)}>
      <motion.div
        className={`flex flex-col gap-2 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      >
        {items.map((item, idx) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: open ? 1 : 0,
              y: open ? 0 : 10,
            }}
            transition={{
              delay: idx * 0.05,
            }}
            className="h-10 w-10 rounded-full bg-gray-50 dark:bg-neutral-900 flex items-center justify-center"
          >
            <div className="h-4 w-4">{item.icon}</div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

const FloatingDockDesktop = ({
  items,
  className,
}: {
  items: { title: string; icon: React.ReactNode; href?: string; onClick?: () => void }[];
  className?: string;
}) => {
  let mouseX = React.useRef(0);
  return (
    <motion.div
      onMouseMove={(e) => (mouseX.current = e.pageX)}
      className={cn(
        "mx-auto hidden md:flex h-16 gap-4 items-end rounded-2xl bg-gray-50 dark:bg-neutral-900 px-4 pb-3",
        className
      )}
    >
      {items.map((item) => (
        <IconContainer mouseX={mouseX} key={item.title} {...item} />
      ))}
    </motion.div>
  );
};

function IconContainer({
  mouseX,
  title,
  icon,
  href,
  onClick,
}: {
  mouseX: React.RefObject<number>;
  title: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
}) {
  let ref = React.useRef<HTMLDivElement>(null);

  let distance = React.useRef(0);

  React.useEffect(() => {
    let updateMouseX = (e: MouseEvent) => {
      if (ref.current && mouseX.current !== undefined) {
        let rect = ref.current.getBoundingClientRect();
        distance.current = Math.abs(mouseX.current - rect.x - rect.width / 2);
      }
    };
    document.addEventListener("mousemove", updateMouseX);
    return () => document.removeEventListener("mousemove", updateMouseX);
  }, [mouseX]);

  return (
    <motion.div
      ref={ref}
      whileHover={{ scale: 1.1 }}
      className="aspect-square rounded-full bg-gray-200 dark:bg-neutral-800 flex items-center justify-center relative"
      onClick={onClick}
    >
      <div className="flex items-center justify-center h-6 w-6">
        {icon}
      </div>
    </motion.div>
  );
}
