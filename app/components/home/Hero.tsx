"use client";

import Image from "next/image";
import { motion } from "motion/react";
import Button from "../Button";
import Container from "../Container";
import CommandCenter from "./CommandCenter";
import ScrollTilt from "../ScrollTilt";
import AuroraGlow from "../AuroraGlow";

const PROOF = [
  { value: "3", label: "specialists at the table" },
  { value: "< 1 day", label: "to a real answer" },
  { value: "Fixed fee", label: "agreed before we start" },
  { value: "100%", label: "founder-led delivery" },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-navy text-ivory">
      <AuroraGlow />

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
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                className="inline-flex items-center gap-3 border border-ivory/15 bg-ivory/5 px-3 py-2 text-xs uppercase tracking-[0.2em] text-slate-soft"
              >
                Smart Solutions, Built for You
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.85, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="font-display mt-7 max-w-3xl text-[2.6rem] leading-[1] tracking-tight sm:text-[3.4rem] lg:text-[4rem] xl:text-[4.6rem]"
              >
                Know what is happening.{" "}
                <em className="not-italic text-slate-soft">Know what to do next.</em>
              </motion.h1>
            </div>

            <div>
              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="max-w-2xl text-base leading-relaxed text-slate-soft sm:text-lg"
              >
                JNS builds AI voice agents, custom dashboards, CRM workflows,
                automations, and security systems for small businesses ready to
                operate with clarity.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
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
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-2 gap-px bg-ivory/10 border border-ivory/10 sm:grid-cols-4"
          >
            {PROOF.map((item) => (
              <div key={item.label} className="bg-navy px-6 py-5">
                <p className="font-display text-2xl sm:text-3xl text-ivory tracking-tight leading-none">
                  {item.value}
                </p>
                <p className="mt-2 text-xs text-slate-soft leading-snug">
                  {item.label}
                </p>
              </div>
            ))}
          </motion.div>

          {/* Command center demo — Apple-style 3D reveal */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.95, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            {/* Soft floor glow beneath the panel */}
            <div
              aria-hidden="true"
              className="absolute inset-x-8 -bottom-6 h-24 rounded-[50%] bg-black/40 blur-3xl"
            />
            <ScrollTilt className="relative">
              <CommandCenter />
            </ScrollTilt>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
