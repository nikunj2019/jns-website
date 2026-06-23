"use client";

import { useRef, type ReactNode } from "react";
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValue,
  useReducedMotion,
} from "motion/react";

/**
 * Apple-style 3D reveal. As the element scrolls into view it lifts from a
 * tilted-back perspective to flat, and it responds to the pointer with a
 * subtle parallax tilt. Honors prefers-reduced-motion.
 */
export default function ScrollTilt({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.9", "start 0.35"],
  });

  // Scroll-driven flatten
  const rotateXRaw = useTransform(scrollYProgress, [0, 1], [13, 0]);
  const scaleRaw = useTransform(scrollYProgress, [0, 1], [0.93, 1]);
  const rotateX = useSpring(rotateXRaw, { stiffness: 90, damping: 22 });
  const scale = useSpring(scaleRaw, { stiffness: 90, damping: 22 });

  // Pointer-driven parallax
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const tiltY = useSpring(useTransform(px, [-0.5, 0.5], [-5, 5]), {
    stiffness: 120,
    damping: 18,
  });
  const tiltX = useSpring(useTransform(py, [-0.5, 0.5], [4, -4]), {
    stiffness: 120,
    damping: 18,
  });

  function handlePointer(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width - 0.5);
    py.set((e.clientY - rect.top) / rect.height - 0.5);
  }
  function reset() {
    px.set(0);
    py.set(0);
  }

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{ perspective: 1400 }}
      onPointerMove={handlePointer}
      onPointerLeave={reset}
    >
      <motion.div
        style={{
          rotateX,
          scale,
          transformStyle: "preserve-3d",
          transformOrigin: "center top",
        }}
      >
        <motion.div style={{ rotateX: tiltX, rotateY: tiltY, transformStyle: "preserve-3d" }}>
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}
