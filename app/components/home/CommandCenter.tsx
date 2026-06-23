"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { commandModules } from "./content";
import CountUp from "../CountUp";

const pipelineRows = [
  ["New inquiry", "Google Ads", "$12.4k", "Call today"],
  ["Proposal sent", "Referral", "$28.0k", "Follow up"],
  ["Site audit", "Meta Ads", "$7.8k", "Needs scope"],
  ["Won", "Organic", "$18.6k", "Kickoff"],
];

const actions = [
  "Follow up with 7 hot leads before 4 PM.",
  "Pause one campaign with CPA above target.",
  "Automate invoice reminders for 18 overdue accounts.",
  "Review admin access for two inactive users.",
];

export default function CommandCenter() {
  const [activeId, setActiveId] = useState(commandModules[0].id);
  const active =
    commandModules.find((module) => module.id === activeId) ?? commandModules[0];

  return (
    <div className="min-w-0 overflow-hidden border border-slate-line bg-ivory shadow-[0_40px_120px_-70px_rgba(30,42,58,0.55)]">
      <div className="grid gap-4 border-b border-slate-line bg-cream/55 px-4 py-4 xl:grid-cols-[0.7fr_1.3fr] xl:items-center">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.22em] text-slate">
            JNS Business Command Center
          </p>
          <p className="mt-1 font-display text-xl tracking-tight text-navy">
            Performance, customers, actions, growth, risk.
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
                  <h3 className="font-display text-2xl leading-[1.05] tracking-tight text-navy sm:text-3xl xl:text-[2.35rem]">
                    {active.title}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-navy/70">
                    {active.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                  {active.stats.map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, delay: index * 0.05 }}
                      className="border border-slate-line bg-cream/35 p-3"
                    >
                      <p className="text-[0.62rem] uppercase tracking-[0.18em] text-slate">
                        {stat.label}
                      </p>
                      <p className="mt-2 font-display text-2xl tracking-tight text-navy xl:text-[1.75rem]">
                        {stat.value.match(/^\d+$/) ? (
                          <CountUp end={Number(stat.value)} duration={1.2} />
                        ) : (
                          stat.value
                        )}
                      </p>
                      <p className="mt-1 text-xs text-slate">{stat.delta}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="border border-slate-line">
              <div className="border-b border-slate-line bg-cream/35 px-4 py-3">
                <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate">
                  CRM pipeline
                </p>
              </div>
              <div className="divide-y divide-slate-line">
                {pipelineRows.map((row) => (
                  <div
                    key={row.join("-")}
                    className="grid grid-cols-[1.2fr_0.9fr_0.7fr_0.9fr] gap-3 px-4 py-3 text-xs"
                  >
                    <span className="font-medium text-navy">{row[0]}</span>
                    <span className="text-slate">{row[1]}</span>
                    <span className="text-navy/75">{row[2]}</span>
                    <span className="text-right text-slate">{row[3]}</span>
                  </div>
                ))}
              </div>
            </div>

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
                    <span className="leading-relaxed text-navy/78">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside className="bg-navy p-5 text-ivory sm:p-6 xl:p-7">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-soft">
            Live system health
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:block xl:space-y-5">
            {[
              ["Revenue pace", "118%", "ahead of target"],
              ["Lead response", "2h 14m", "median time"],
              ["Campaign waste", "$640", "to reallocate"],
              ["Security posture", "Low", "residual risk"],
            ].map(([label, value, hint], index) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: 12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: index * 0.08 }}
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
