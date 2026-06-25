"use client";

import React from "react";
import { motion } from "motion/react";
import Container from "../Container";
import Reveal, { RevealGroup, RevealItem } from "../Reveal";
import { processSteps } from "./content";

export default function ProcessStrip() {
  return (
    <section id="process" className="bg-cream py-24 sm:py-28 lg:py-32">
      <Container size="wide">
        <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.22em] text-slate">
              Process
            </p>
            <h2 className="font-display mt-5 text-4xl leading-[1.05] tracking-tight sm:text-5xl">
              Listen. Scope. Build. Support.
            </h2>
          </Reveal>
          <Reveal delay={0.08} className="lg:pt-8">
            <p className="text-lg leading-relaxed text-navy/75">
              We start with the messy reality of the business, then ship the
              smallest useful system that creates visibility, action, and
              measurable value.
            </p>
          </Reveal>
        </div>

        <div className="mt-14">
          {/* Step circles row — desktop only */}
          <div className="hidden md:flex items-center mb-10">
            {processSteps.map((step, i) => (
              <React.Fragment key={step.title}>
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.12, type: "spring", stiffness: 200 }}
                  className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-slate-line bg-ivory flex items-center justify-center z-10"
                >
                  <span className="font-display text-lg text-navy">{i + 1}</span>
                </motion.div>
                {i < processSteps.length - 1 && (
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: i * 0.12 + 0.3 }}
                    style={{ transformOrigin: "left" }}
                    className="flex-1 h-px bg-slate-line"
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Content cards */}
          <RevealGroup className="grid gap-4 md:grid-cols-4" stagger={0.08}>
            {processSteps.map((step, i) => (
              <RevealItem key={step.title}>
                <article className="bg-cream rounded-xl p-7 border border-slate-line/50 h-full">
                  <span className="md:hidden font-display text-3xl text-slate-line">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display text-2xl tracking-tight mt-2 md:mt-0">
                    {step.title}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-navy/75">
                    {step.body}
                  </p>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </Container>
    </section>
  );
}
