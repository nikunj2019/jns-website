"use client";

import { motion } from "motion/react";

const panels = [
  {
    eyebrow: "AI Voice Agent",
    live: true,
    headline: "847",
    unit: "calls handled",
    sub: "this month, with no staff",
    rows: [
      { label: "After hours", value: "68%" },
      { label: "Avg. booking time", value: "58 sec" },
      { label: "Missed calls", value: "0" },
    ],
  },
  {
    eyebrow: "Owner Dashboard",
    live: false,
    headline: "$84.2k",
    unit: "revenue",
    sub: "this month, in one view",
    rows: [
      { label: "Occupancy", value: "94%" },
      { label: "Outstanding", value: "$3.1k" },
      { label: "New clients", value: "38" },
    ],
  },
  {
    eyebrow: "Workflow Automation",
    live: false,
    headline: "38 hrs",
    unit: "saved",
    sub: "per month, per client",
    rows: [
      { label: "Invoices automated", value: "48" },
      { label: "On-time payments", value: "94%" },
      { label: "SMS open rate", value: "61%" },
    ],
  },
];

export default function HeroShowcase() {
  return (
    <div className="flex overflow-x-auto snap-x snap-mandatory gap-px bg-ivory/10 border border-ivory/10 sm:grid sm:grid-cols-3 sm:overflow-x-visible">
      {panels.map((p, i) => (
        <motion.div
          key={p.eyebrow}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white/[0.04] backdrop-blur-md border border-white/[0.08] px-5 py-6 sm:px-7 sm:py-8 hover:bg-white/[0.07] transition-all duration-300 snap-center shrink-0 w-[82vw] sm:w-auto"
        >
          {/* Label */}
          <div className="flex items-center gap-2.5">
            {p.live && (
              <motion.span
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="h-1.5 w-1.5 rounded-full bg-green-400 shrink-0"
                aria-hidden="true"
              />
            )}
            <p className="text-[0.65rem] uppercase tracking-[0.22em] text-slate-soft">
              {p.eyebrow}
            </p>
          </div>

          {/* Big number */}
          <p className="text-gradient font-display mt-5 text-4xl leading-none tracking-tight sm:text-5xl">
            {p.headline}
          </p>
          <p className="mt-1.5 text-sm text-slate-soft">
            {p.unit} <span className="text-slate-soft/50">{p.sub}</span>
          </p>

          {/* Row breakdown */}
          <div className="mt-6 space-y-2.5 border-t border-ivory/10 pt-5">
            {p.rows.map((r) => (
              <div key={r.label} className="flex items-baseline justify-between gap-4">
                <span className="text-xs text-slate-soft/70">{r.label}</span>
                <span className="font-display text-base tracking-tight text-ivory">
                  {r.value}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
