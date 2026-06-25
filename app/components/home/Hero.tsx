"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Button from "../Button";
import Container from "../Container";
import HeroShowcase from "./HeroShowcase";
import AuroraGlow from "../AuroraGlow";

const PROOF = [
  { value: "3", label: "specialists at the table" },
  { value: "< 1 day", label: "to a real answer" },
  { value: "Fixed fee", label: "agreed before we start" },
  { value: "100%", label: "founder-led delivery" },
];

const PHRASE1 = ["Know", "what", "is", "happening."];
const PHRASE2 = ["Know", "what", "to", "do", "next."];

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 1], ["0%", "30%"]);

  return (
    <section ref={ref} className="relative overflow-hidden bg-navy text-ivory">
      {/* Parallax background layer */}
      <motion.div
        style={reduce ? {} : { y: bgY }}
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      >
        <AuroraGlow />
        <div className="dot-grid absolute inset-0" aria-hidden="true" />
        {/* Edge vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 90% 80% at 50% 50%, transparent 30%, rgba(30,42,58,0.5) 100%)",
          }}
        />
      </motion.div>

      {/* Watermark logo */}
      <div
        aria-hidden="true"
        className="absolute -right-28 top-10 h-[520px] w-[520px] opacity-[0.045]"
      >
        <Image
          src="/jns-logo.png"
          alt=""
          fill
          priority
          sizes="520px"
          className="object-contain invert"
        />
      </div>

      <Container size="wide" className="relative py-14 sm:py-20 xl:py-24">
        <div className="space-y-12">
          {/* Headline + CTA row */}
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-end lg:gap-14">
            <div>
              {/* Badge */}
              <motion.div
                initial={reduce ? {} : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                className="inline-flex items-center gap-3 rounded-full border border-ivory/15 bg-ivory/5 backdrop-blur-sm px-3 py-2 text-xs uppercase tracking-[0.2em] text-slate-soft"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full bg-green-400 shrink-0 glow-pulse"
                  aria-hidden="true"
                />
                Smart Solutions, Built for You
              </motion.div>

              {/* Hero headline — word-by-word blur-in */}
              <h1 className="font-display mt-7 max-w-3xl text-[2.6rem] leading-[1] tracking-tight sm:text-[3.4rem] lg:text-[4rem] xl:text-[4.6rem]">
                {PHRASE1.map((word, i) => (
                  <motion.span
                    key={`p1-${i}`}
                    initial={reduce ? {} : { opacity: 0, y: 20, filter: "blur(8px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{
                      duration: 0.65,
                      delay: reduce ? 0 : 0.1 + i * 0.08,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="inline-block mr-[0.25em]"
                  >
                    {word}
                  </motion.span>
                ))}{" "}
                <em className="not-italic text-slate-soft">
                  {PHRASE2.map((word, i) => (
                    <motion.span
                      key={`p2-${i}`}
                      initial={reduce ? {} : { opacity: 0, y: 20, filter: "blur(8px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      transition={{
                        duration: 0.65,
                        delay: reduce ? 0 : 0.1 + PHRASE1.length * 0.08 + 0.1 + i * 0.08,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="inline-block mr-[0.25em]"
                    >
                      {word}
                    </motion.span>
                  ))}
                </em>
              </h1>
            </div>

            <div>
              <motion.p
                initial={reduce ? {} : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: reduce ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="max-w-2xl text-base leading-relaxed text-slate-soft sm:text-lg"
              >
                JNS builds AI voice agents, custom dashboards, CRM workflows,
                automations, and security systems for small businesses ready to
                operate with clarity.
              </motion.p>

              <motion.div
                initial={reduce ? {} : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: reduce ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="mt-8 flex flex-wrap gap-3"
              >
                <Button
                  href="/contact"
                  size="lg"
                  variant="secondary"
                  className="border-ivory bg-ivory text-navy hover:bg-transparent hover:text-ivory"
                >
                  Start the conversation
                </Button>
                <Button
                  href="#command-center"
                  size="lg"
                  variant="secondary"
                  className="border-ivory/35 text-ivory hover:border-ivory hover:bg-ivory hover:text-navy"
                >
                  See the platform
                </Button>
              </motion.div>
            </div>
          </div>

          {/* Proof bar */}
          <motion.div
            initial={reduce ? {} : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: reduce ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-2 gap-px bg-ivory/10 border border-ivory/10 sm:grid-cols-4 rounded-2xl overflow-hidden"
          >
            {PROOF.map((item) => (
              <div key={item.label} className="bg-navy px-6 py-5 backdrop-blur-sm">
                <p className="font-display text-2xl sm:text-3xl text-ivory tracking-tight leading-none">
                  {item.value}
                </p>
                <p className="mt-2 text-xs text-slate-soft leading-snug">
                  {item.label}
                </p>
              </div>
            ))}
          </motion.div>

          {/* Metric showcase */}
          <motion.div
            initial={reduce ? {} : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.95, delay: reduce ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            <HeroShowcase />
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
