"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Dramatic multi-orb aurora glow for dark (navy) sections.
 * Four large, slow-drifting radial glows — brand-restrained palette,
 * very low opacity, heavy blur. Adds cinematic depth without overpowering.
 */
export default function AuroraGlow({ className = "" }: { className?: string }) {
  const reduce = useReducedMotion();

  const orb1 = reduce
    ? {}
    : {
        animate: { x: [0, 40, -10, 0], y: [0, -30, 15, 0], opacity: [0.55, 0.8, 0.6, 0.55] },
        transition: { duration: 18, repeat: Infinity, ease: "easeInOut" as const },
      };

  const orb2 = reduce
    ? {}
    : {
        animate: { x: [0, -45, 20, 0], y: [0, 25, -15, 0], opacity: [0.45, 0.65, 0.5, 0.45] },
        transition: { duration: 22, repeat: Infinity, ease: "easeInOut" as const, delay: 3 },
      };

  const orb3 = reduce
    ? {}
    : {
        animate: { x: [0, -25, 35, 0], y: [0, 35, -20, 0], opacity: [0.35, 0.55, 0.4, 0.35] },
        transition: { duration: 20, repeat: Infinity, ease: "easeInOut" as const, delay: 7 },
      };

  const orb4 = reduce
    ? {}
    : {
        animate: { x: [0, 20, -30, 0], y: [0, -25, 30, 0], opacity: [0.25, 0.4, 0.3, 0.25] },
        transition: { duration: 25, repeat: Infinity, ease: "easeInOut" as const, delay: 11 },
      };

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      <motion.div
        {...orb1}
        className="absolute -top-32 -left-20 h-[700px] w-[700px] rounded-full bg-slate-soft/[0.14] blur-[130px]"
      />
      <motion.div
        {...orb2}
        className="absolute -bottom-20 -right-10 h-[600px] w-[600px] rounded-full bg-ivory/[0.08] blur-[140px]"
      />
      <motion.div
        {...orb3}
        className="absolute top-[15%] right-[10%] h-[500px] w-[500px] rounded-full bg-slate/[0.10] blur-[120px]"
      />
      <motion.div
        {...orb4}
        className="absolute top-[40%] -left-10 h-[400px] w-[400px] rounded-full bg-cream/[0.08] blur-[110px]"
      />
    </div>
  );
}
