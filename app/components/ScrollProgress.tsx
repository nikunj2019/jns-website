"use client";

import { motion, useScroll, useSpring } from "motion/react";

/**
 * Top-fixed scroll progress bar — thin navy line that fills as the user scrolls.
 * Sits below the sticky header (header has z-50, this uses z-[60]).
 */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 22,
    mass: 0.4,
  });

  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX, transformOrigin: "0% 50%" }}
      className="fixed top-0 left-0 right-0 h-[2px] bg-navy z-[60] pointer-events-none"
    />
  );
}
