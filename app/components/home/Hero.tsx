"use client";

import Image from "next/image";
import { motion } from "motion/react";
import Button from "../Button";
import Container from "../Container";
import CommandCenter from "./CommandCenter";

const selectors = [
  "See performance",
  "Manage customers",
  "Take action",
  "Grow",
  "Secure",
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-navy text-ivory">
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

      <Container size="wide" className="relative py-12 sm:py-16 xl:py-20">
        <div className="space-y-10">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end lg:gap-14">
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
              className="font-display mt-7 max-w-3xl text-[2.55rem] leading-[1] tracking-tight sm:text-[3.35rem] lg:text-[3.85rem] xl:text-[4.45rem]"
            >
              Know what is happening. Know what to do next.
            </motion.h1>
            </div>

            <div>
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-2xl text-base leading-relaxed text-slate-soft sm:text-lg"
            >
              JNS builds custom KPI dashboards, CRM workflows, AI automations,
              ad tracking, and security systems for small businesses ready to
              operate with clarity.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="mt-7 flex flex-wrap gap-3"
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

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.48, ease: [0.22, 1, 0.36, 1] }}
              className="mt-7 flex flex-wrap gap-2"
            >
              {selectors.map((selector) => (
                <span
                  key={selector}
                  className="border border-ivory/12 bg-ivory/5 px-3 py-2 text-xs text-slate-soft"
                >
                  {selector}
                </span>
              ))}
            </motion.div>
          </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.95, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="min-w-0 rounded-none"
          >
            <CommandCenter />
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
