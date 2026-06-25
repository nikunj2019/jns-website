"use client";

import Container from "../Container";
import CountUp from "../CountUp";
import { RevealGroup, RevealItem } from "../Reveal";
import AuroraGlow from "../AuroraGlow";

const metrics = [
  {
    value: 10,
    suffix: "+",
    label: "Years combined",
    sub: "software, audit & ops",
  },
  {
    value: 3,
    suffix: "",
    label: "Founding experts",
    sub: "one engagement, one team",
  },
  {
    value: 1,
    suffix: " day",
    label: "To a real answer",
    sub: "always a person, never a bot",
  },
  {
    value: 100,
    suffix: "%",
    label: "Fixed-fee work",
    sub: "scope agreed before we start",
  },
];

export default function TrustMetrics() {
  return (
    <section className="relative overflow-hidden bg-navy text-ivory">
      <AuroraGlow />
      <Container size="wide" className="relative py-24 sm:py-28 lg:py-32">
        <RevealGroup
          className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-12"
          stagger={0.1}
        >
          {metrics.map((m) => (
            <RevealItem key={m.label}>
              <div className="bg-white/[0.04] backdrop-blur-sm border border-ivory/[0.08] rounded-2xl p-8 lg:p-10 flex flex-col h-full">
                <p className="text-gradient font-display text-5xl sm:text-6xl tracking-tight leading-none">
                  <CountUp end={m.value} suffix={m.suffix} duration={1.6} />
                </p>
                <p className="mt-5 text-base font-medium text-ivory leading-snug">
                  {m.label}
                </p>
                <p className="mt-2 text-sm text-slate-soft leading-relaxed">
                  {m.sub}
                </p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}
