"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  speed?: number;
  className?: string;
  pauseOnHover?: boolean;
};

/**
 * Infinite horizontal marquee. CSS transforms via motion. Brand-appropriate slow pace.
 */
export default function Marquee({
  children,
  speed = 60,
  className,
  pauseOnHover = false,
}: Props) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div
      className={`overflow-hidden whitespace-nowrap ${className ?? ""}`}
      role="marquee"
      aria-hidden="true"
    >
      <motion.div
        className="inline-flex gap-12 will-change-transform"
        animate={
          prefersReducedMotion
            ? undefined
            : { x: ["0%", "-50%"] }
        }
        transition={{
          duration: speed,
          ease: "linear",
          repeat: Infinity,
          repeatType: "loop",
        }}
        whileHover={pauseOnHover ? { animationPlayState: "paused" } : undefined}
      >
        <div className="inline-flex gap-12 items-center shrink-0">{children}</div>
        <div className="inline-flex gap-12 items-center shrink-0" aria-hidden="true">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
