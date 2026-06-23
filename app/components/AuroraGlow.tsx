"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Soft, slow-drifting radial glows for dark (navy) sections. Brand-restrained:
 * ivory and slate light only, very low opacity, heavy blur. Adds depth without
 * turning the palette into a gradient soup.
 */
export default function AuroraGlow({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();

  const drift = reduce
    ? {}
    : {
        animate: { x: [0, 28, 0], y: [0, -22, 0], opacity: [0.5, 0.75, 0.5] },
        transition: { duration: 14, repeat: Infinity, ease: "easeInOut" as const },
      };
  const drift2 = reduce
    ? {}
    : {
        animate: { x: [0, -32, 0], y: [0, 18, 0], opacity: [0.45, 0.7, 0.45] },
        transition: { duration: 18, repeat: Infinity, ease: "easeInOut" as const },
      };

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <motion.div
        {...drift}
        className="absolute -top-24 left-[12%] h-[460px] w-[460px] rounded-full bg-slate-soft/[0.12] blur-[130px]"
      />
      <motion.div
        {...drift2}
        className="absolute bottom-[-10%] right-[10%] h-[420px] w-[420px] rounded-full bg-ivory/[0.07] blur-[130px]"
      />
    </div>
  );
}
