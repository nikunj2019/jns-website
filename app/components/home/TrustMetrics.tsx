"use client";

import Container from "../Container";
import CountUp from "../CountUp";
import { RevealGroup, RevealItem } from "../Reveal";

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
    <section className="bg-navy text-ivory">
      <Container size="wide" className="py-24 sm:py-28 lg:py-32">
        <RevealGroup
          className="grid grid-cols-2 gap-px bg-ivory/10 border border-ivory/10 lg:grid-cols-4"
          stagger={0.1}
        >
          {metrics.map((m) => (
            <RevealItem key={m.label}>
              <div className="bg-navy p-8 lg:p-10 flex flex-col h-full">
                <p className="font-display text-5xl sm:text-6xl tracking-tight leading-none text-ivory">
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
