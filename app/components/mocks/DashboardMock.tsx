"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";
import BrowserFrame from "./BrowserFrame";
import CountUp from "../CountUp";

/**
 * Mock: small-business custom admin dashboard.
 * Shows what a "Custom Build" deliverable looks like — booking, revenue, customer activity.
 */
export default function DashboardMock() {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const prefersReducedMotion = useReducedMotion();
  const animate = inView && !prefersReducedMotion;

  return (
    <BrowserFrame url="app.acmehotel.com/dashboard" className="shadow-[0_30px_80px_-40px_rgba(30,42,58,0.25)]">
      <div ref={ref} className="grid grid-cols-12 min-h-[460px] text-navy">
        {/* Sidebar */}
        <aside className="col-span-3 border-r border-slate-line bg-cream/40 p-5">
          <div className="font-display text-[0.875rem] tracking-tight">
            Acme Hotel<span className="text-slate">.</span>
          </div>
          <nav className="mt-7 space-y-1 text-[0.6875rem]">
            {[
              { l: "Dashboard", active: true },
              { l: "Bookings", n: "12" },
              { l: "Guests", n: "284" },
              { l: "Rooms" },
              { l: "Reports" },
              { l: "Settings" },
            ].map((item) => (
              <div
                key={item.l}
                className={`flex items-center justify-between px-2.5 py-1.5 ${
                  item.active ? "bg-navy text-ivory" : "text-navy/70"
                }`}
              >
                <span>{item.l}</span>
                {item.n && (
                  <span
                    className={`text-[0.5625rem] ${
                      item.active ? "text-ivory/70" : "text-slate"
                    }`}
                  >
                    {item.n}
                  </span>
                )}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <div className="col-span-9 p-6">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-[0.625rem] uppercase tracking-[0.18em] text-slate">
                Overview · This week
              </p>
              <h4 className="font-display text-lg mt-1 tracking-tight">
                Good afternoon, Shayar
              </h4>
            </div>
            <span className="text-[0.625rem] text-slate">Updated 2 min ago</span>
          </div>

          {/* KPI cards */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              { l: "Bookings", end: 142, suffix: "" },
              { l: "Revenue", end: 38, prefix: "$", suffix: "k" },
              { l: "Occupancy", end: 87, suffix: "%" },
            ].map((k) => (
              <div key={k.l} className="border border-slate-line p-3">
                <p className="text-[0.5625rem] uppercase tracking-[0.18em] text-slate">
                  {k.l}
                </p>
                <p className="font-display mt-1.5 text-2xl tracking-tight">
                  <CountUp end={k.end} prefix={k.prefix ?? ""} suffix={k.suffix} duration={1.6} />
                </p>
                <p className="mt-0.5 text-[0.5625rem] text-slate">
                  ↑ vs last week
                </p>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div className="mt-5 border border-slate-line p-4">
            <div className="flex items-center justify-between">
              <p className="text-[0.625rem] uppercase tracking-[0.18em] text-slate">
                Revenue · Last 30 days
              </p>
              <div className="flex gap-3 text-[0.5625rem] text-slate">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-px w-3 bg-navy" /> Revenue
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-px w-3 bg-slate" /> Forecast
                </span>
              </div>
            </div>
            <svg viewBox="0 0 320 100" className="mt-3 w-full h-[100px]">
              {/* Gridlines */}
              {[0, 25, 50, 75].map((y) => (
                <line
                  key={y}
                  x1="0"
                  x2="320"
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-line"
                  strokeDasharray="2 3"
                  strokeWidth="0.5"
                />
              ))}
              {/* Forecast line (slate, dashed) */}
              <motion.path
                d="M0,70 C40,68 80,60 120,52 C160,45 200,40 240,35 C280,30 300,28 320,25"
                stroke="currentColor"
                className="text-slate"
                strokeWidth="1"
                strokeDasharray="3 3"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={animate ? { pathLength: 1 } : undefined}
                transition={{ duration: 1.4, ease: "easeOut", delay: 0.1 }}
              />
              {/* Actual revenue (navy, solid) */}
              <motion.path
                d="M0,80 C20,75 40,72 60,60 C80,52 100,55 120,45 C140,38 160,40 180,30 C200,25 220,20 240,18 C260,15 280,12 320,8"
                stroke="currentColor"
                className="text-navy"
                strokeWidth="1.4"
                fill="none"
                initial={{ pathLength: 0 }}
                animate={animate ? { pathLength: 1 } : undefined}
                transition={{ duration: 1.6, ease: "easeOut" }}
              />
              {/* Area fill */}
              <motion.path
                d="M0,80 C20,75 40,72 60,60 C80,52 100,55 120,45 C140,38 160,40 180,30 C200,25 220,20 240,18 C260,15 280,12 320,8 L320,100 L0,100 Z"
                fill="currentColor"
                className="text-navy/8"
                initial={{ opacity: 0 }}
                animate={animate ? { opacity: 1 } : undefined}
                transition={{ duration: 1.2, delay: 0.6 }}
              />
            </svg>
          </div>

          {/* Recent bookings */}
          <div className="mt-4">
            <p className="text-[0.625rem] uppercase tracking-[0.18em] text-slate">
              Recent bookings
            </p>
            <ul className="mt-2 divide-y divide-slate-line border-t border-slate-line">
              {[
                { g: "M. Hernandez", r: "Suite 204", n: "2 nights", s: "Confirmed" },
                { g: "Patel Family", r: "Rooms 110–112", n: "4 nights", s: "Pending" },
                { g: "T. Walker", r: "Suite 312", n: "1 night", s: "Confirmed" },
              ].map((b, i) => (
                <motion.li
                  key={b.g}
                  initial={{ opacity: 0, x: -8 }}
                  animate={animate ? { opacity: 1, x: 0 } : undefined}
                  transition={{ duration: 0.5, delay: 0.4 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                  className="grid grid-cols-12 items-center py-2 text-[0.6875rem]"
                >
                  <span className="col-span-4 text-navy">{b.g}</span>
                  <span className="col-span-4 text-slate">{b.r}</span>
                  <span className="col-span-2 text-slate">{b.n}</span>
                  <span
                    className={`col-span-2 justify-self-end px-2 py-0.5 text-[0.5625rem] uppercase tracking-[0.14em] ${
                      b.s === "Confirmed"
                        ? "bg-navy text-ivory"
                        : "border border-slate text-slate"
                    }`}
                  >
                    {b.s}
                  </span>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}
