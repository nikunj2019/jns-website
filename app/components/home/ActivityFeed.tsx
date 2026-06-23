"use client";

import { motion } from "motion/react";

const events = [
  {
    time: "11:47 PM",
    module: "AI Voice",
    text: "Booked Taylor · haircut & color · Sat 2:30 PM",
    dot: "bg-green-400",
  },
  {
    time: "2:03 AM",
    module: "AI Voice",
    text: "Booked Marcus · full grooming set · Sun 10:00 AM",
    dot: "bg-green-400",
  },
  {
    time: "8:01 AM",
    module: "Dashboard",
    text: "Revenue $84.2k this month · 3 invoices still open",
    dot: "bg-ivory",
  },
  {
    time: "8:15 AM",
    module: "Automations",
    text: "Overdue alert sent to Suite 4 · $340 outstanding",
    dot: "bg-ivory",
  },
  {
    time: "10:30 AM",
    module: "Automations",
    text: "14 re-engagement texts sent · 9 opened within the hour",
    dot: "bg-ivory",
  },
  {
    time: "3:18 PM",
    module: "AI Voice",
    text: "End-of-day rush · 6 calls handled · 5 bookings · 0 staff",
    dot: "bg-green-400",
  },
  {
    time: "5:00 PM",
    module: "Security",
    text: "Posture check complete · 4 open findings · risk stable",
    dot: "bg-slate-400",
  },
];

export default function ActivityFeed() {
  return (
    <div className="border border-ivory/15 bg-ivory/5 backdrop-blur-sm shadow-[0_40px_120px_-60px_rgba(0,0,0,0.6)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-ivory/15 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <motion.span
            animate={{ opacity: [1, 0.25, 1] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="h-1.5 w-1.5 rounded-full bg-green-400"
            aria-hidden="true"
          />
          <p className="text-[0.65rem] uppercase tracking-[0.22em] text-slate-soft">
            Live system · last 24 hours
          </p>
        </div>
        <p className="text-[0.65rem] tabular-nums text-slate-soft/50">7 events</p>
      </div>

      {/* Feed */}
      <div className="divide-y divide-ivory/8 px-5 py-2">
        {events.map((e, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-start gap-4 py-3"
          >
            <span className="mt-1.5 shrink-0 tabular-nums text-[0.7rem] text-slate-soft/60 w-14 text-right">
              {e.time}
            </span>
            <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${e.dot}`} aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <span className="mr-2 text-[0.6rem] uppercase tracking-[0.18em] text-slate-soft/50">
                {e.module}
              </span>
              <span className="text-sm leading-relaxed text-ivory/85">{e.text}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-ivory/15 px-5 py-3">
        <p className="text-[0.65rem] text-slate-soft/50">
          All of this happened with no manual input.
        </p>
      </div>
    </div>
  );
}
