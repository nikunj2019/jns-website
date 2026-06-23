"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { commandModules } from "./content";

const appointmentRows = [
  ["Taylor M.", "Haircut + Color", "$145", "Today 2 pm"],
  ["Jordan K.", "Full Grooming Set", "$85", "Tomorrow 10 am"],
  ["Casey R.", "Blowout", "$55", "Fri 4 pm"],
  ["Alex T.", "Consultation", "—", "Pending"],
];

const actions = [
  "AI booked 3 appointments overnight — review confirmations.",
  "Invoice overdue: Suite 4, 12 days past due. Send reminder.",
  "Re-engage 14 clients not seen in 60+ days via SMS.",
  "Staff utilization below 70% Thursday — adjust schedule.",
];

const health = [
  ["AI bookings today", "7", "and counting"],
  ["Invoice collection", "94%", "on-time rate"],
  ["SMS open rate", "61%", "last campaign"],
  ["Security posture", "Low", "residual risk"],
];

export default function CommandCenter() {
  const [activeId, setActiveId] = useState(commandModules[0].id);
  const active =
    commandModules.find((m) => m.id === activeId) ?? commandModules[0];

  return (
    <div className="min-w-0 overflow-hidden border border-slate-line bg-ivory shadow-[0_40px_120px_-70px_rgba(30,42,58,0.55)]">
      {/* Header */}
      <div className="grid gap-4 border-b border-slate-line bg-cream/55 px-4 py-4 xl:grid-cols-[0.7fr_1.3fr] xl:items-center">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.22em] text-slate">
            JNS Business Command Center
          </p>
          <p className="mt-1 font-display text-xl tracking-tight text-navy">
            Built around your business, not a template.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
          {commandModules.map((module) => (
            <button
              key={module.id}
              type="button"
              onClick={() => setActiveId(module.id)}
              className={`border px-2.5 py-2 text-[0.7rem] transition-colors ${
                activeId === module.id
                  ? "border-navy bg-navy text-ivory"
                  : "border-slate-line bg-ivory text-navy/70 hover:border-navy hover:text-navy"
              }`}
            >
              {module.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="grid gap-px bg-slate-line xl:grid-cols-[1.35fr_0.65fr]">
        <div className="bg-ivory p-4 sm:p-6 xl:p-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-xs uppercase tracking-[0.2em] text-slate">
                {active.eyebrow}
              </p>
              <div className="mt-4 grid gap-5 lg:grid-cols-[0.78fr_1.22fr]">
                <div>
                  <h3 className="font-display text-2xl leading-[1.05] tracking-tight text-navy sm:text-3xl xl:text-[2.2rem]">
                    {active.title}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-navy/70">
                    {active.description}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                  {active.stats.map((stat, i) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: i * 0.06 }}
                      className="border border-slate-line bg-cream/35 p-3"
                    >
                      <p className="text-[0.62rem] uppercase tracking-[0.18em] text-slate">
                        {stat.label}
                      </p>
                      <p className="mt-2 font-display text-xl tracking-tight text-navy xl:text-2xl">
                        {stat.value}
                      </p>
                      <p className="mt-1 text-xs text-slate">{stat.delta}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {/* Appointments */}
            <div className="border border-slate-line">
              <div className="border-b border-slate-line bg-cream/35 px-4 py-3">
                <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate">
                  Upcoming appointments
                </p>
              </div>
              <div className="divide-y divide-slate-line">
                {appointmentRows.map((row) => (
                  <div
                    key={row.join("-")}
                    className="grid grid-cols-[1.2fr_1.1fr_0.6fr_0.9fr] gap-3 px-4 py-3 text-xs"
                  >
                    <span className="font-medium text-navy">{row[0]}</span>
                    <span className="text-slate">{row[1]}</span>
                    <span className="text-navy/75">{row[2]}</span>
                    <span className="text-right text-slate">{row[3]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="border border-slate-line">
              <div className="border-b border-slate-line bg-cream/35 px-4 py-3">
                <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate">
                  Recommended actions
                </p>
              </div>
              <div className="divide-y divide-slate-line">
                {actions.map((action) => (
                  <div key={action} className="flex gap-3 px-4 py-3 text-xs">
                    <span className="mt-1 h-px w-4 shrink-0 bg-slate" />
                    <span className="leading-relaxed text-navy/80">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Health panel */}
        <aside className="bg-navy p-5 text-ivory sm:p-6 xl:p-7">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-soft">
            Live system health
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:block xl:space-y-5">
            {health.map(([label, value, hint], i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: 12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: i * 0.08 }}
                className="border-b border-ivory/15 pb-5 last:border-b-0"
              >
                <div className="flex items-end justify-between gap-6">
                  <p className="text-sm text-slate-soft">{label}</p>
                  <p className="font-display text-3xl tracking-tight">{value}</p>
                </div>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-soft/70">
                  {hint}
                </p>
              </motion.div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
