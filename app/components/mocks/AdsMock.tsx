"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";
import BrowserFrame from "./BrowserFrame";
import CountUp from "../CountUp";

/**
 * Mock: paid-ads performance dashboard.
 * Communicates "measurement-first" — clear ROAS, funnel, campaign roster.
 */
export default function AdsMock() {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const prefersReducedMotion = useReducedMotion();
  const animate = inView && !prefersReducedMotion;

  const campaigns = [
    { c: "Search · Brand", spend: 1240, roas: 8.4, pct: 92 },
    { c: "PMax · Conversions", spend: 3180, roas: 4.7, pct: 74 },
    { c: "Meta · Retargeting", spend: 920, roas: 6.1, pct: 81 },
    { c: "Meta · Lookalike 1%", spend: 1860, roas: 3.2, pct: 58 },
  ];

  const funnel = [
    { l: "Impressions", v: "1.24M", w: 100 },
    { l: "Clicks", v: "38,420", w: 62 },
    { l: "Landing visits", v: "31,180", w: 51 },
    { l: "Leads", v: "1,847", w: 28 },
    { l: "Bookings", v: "412", w: 14 },
  ];

  return (
    <BrowserFrame url="ads.jns.consulting/campaigns" className="shadow-[0_30px_80px_-40px_rgba(30,42,58,0.25)]">
      <div ref={ref} className="grid grid-cols-12 min-h-[460px] text-navy">
        {/* Left: headline KPI + funnel */}
        <div className="col-span-5 border-r border-slate-line p-6">
          <p className="text-[0.5625rem] uppercase tracking-[0.18em] text-slate">
            October · all campaigns
          </p>
          <h4 className="font-display mt-2 text-base tracking-tight">
            Return on ad spend
          </h4>

          <div className="mt-4 flex items-baseline gap-2">
            <p className="font-display text-5xl tracking-tight">
              <CountUp end={5.4} decimals={1} suffix="×" duration={1.6} />
            </p>
            <span className="text-[0.625rem] text-slate">
              ↑ 38% vs last month
            </span>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 text-[0.6875rem]">
            {[
              { l: "Spend", v: "$7.2k" },
              { l: "Revenue", v: "$38.9k" },
              { l: "CPA", v: "$17" },
            ].map((m) => (
              <div key={m.l} className="border border-slate-line p-2">
                <p className="text-[0.5625rem] uppercase tracking-[0.14em] text-slate">
                  {m.l}
                </p>
                <p className="mt-0.5 font-display text-base tracking-tight">{m.v}</p>
              </div>
            ))}
          </div>

          {/* Funnel */}
          <div className="mt-6">
            <p className="text-[0.5625rem] uppercase tracking-[0.18em] text-slate">
              Conversion funnel
            </p>
            <ul className="mt-3 space-y-2">
              {funnel.map((stage, i) => (
                <li key={stage.l} className="text-[0.6875rem]">
                  <div className="flex justify-between mb-1">
                    <span>{stage.l}</span>
                    <span className="text-slate">{stage.v}</span>
                  </div>
                  <div className="h-1.5 bg-cream relative overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={animate ? { width: `${stage.w}%` } : undefined}
                      transition={{
                        duration: 1,
                        delay: 0.3 + i * 0.12,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="absolute left-0 top-0 h-full bg-navy"
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: campaign list + spend chart */}
        <div className="col-span-7 p-6">
          <div className="flex items-baseline justify-between">
            <p className="text-[0.5625rem] uppercase tracking-[0.18em] text-slate">
              Campaigns · 4 active
            </p>
            <div className="flex gap-1.5">
              <span className="text-[0.5625rem] text-slate">Google</span>
              <span className="text-[0.5625rem] text-slate">·</span>
              <span className="text-[0.5625rem] text-slate">Meta</span>
            </div>
          </div>

          <table className="mt-3 w-full text-[0.6875rem]">
            <thead>
              <tr className="text-left text-[0.5625rem] uppercase tracking-[0.14em] text-slate border-b border-slate-line">
                <th className="font-normal py-1.5">Campaign</th>
                <th className="font-normal py-1.5 text-right">Spend</th>
                <th className="font-normal py-1.5 text-right">ROAS</th>
                <th className="font-normal py-1.5 w-20">Pace</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c, i) => (
                <motion.tr
                  key={c.c}
                  initial={{ opacity: 0, y: 6 }}
                  animate={animate ? { opacity: 1, y: 0 } : undefined}
                  transition={{ duration: 0.5, delay: 0.2 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  className="border-b border-slate-line/60"
                >
                  <td className="py-2">{c.c}</td>
                  <td className="py-2 text-right text-slate">${c.spend.toLocaleString()}</td>
                  <td className="py-2 text-right font-display tracking-tight">{c.roas}×</td>
                  <td className="py-2">
                    <div className="h-1 bg-cream relative overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={animate ? { width: `${c.pct}%` } : undefined}
                        transition={{ duration: 1, delay: 0.4 + i * 0.08 }}
                        className="absolute left-0 top-0 h-full bg-navy/80"
                      />
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {/* Spend over time bars */}
          <div className="mt-6">
            <p className="text-[0.5625rem] uppercase tracking-[0.18em] text-slate">
              Daily spend · last 14 days
            </p>
            <div className="mt-3 flex items-end gap-1 h-20">
              {[40, 55, 50, 65, 60, 72, 68, 80, 75, 85, 78, 90, 86, 95].map(
                (h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={animate ? { height: `${h}%` } : undefined}
                    transition={{
                      duration: 0.6,
                      delay: 0.3 + i * 0.03,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className={`flex-1 ${i >= 12 ? "bg-navy" : "bg-slate/40"}`}
                  />
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}
