"use client";

import { motion, useInView, useReducedMotion } from "motion/react";
import { useRef } from "react";
import BrowserFrame from "./BrowserFrame";

/**
 * Mock: security audit report.
 * Severity conveyed through visual weight/opacity rather than recoloring the brand —
 * stays disciplined to navy/slate per brand guide.
 */
export default function SecurityMock() {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const prefersReducedMotion = useReducedMotion();
  const animate = inView && !prefersReducedMotion;

  const severities = [
    { l: "Critical", n: 0, weight: "bg-navy", text: "text-ivory" },
    { l: "High", n: 2, weight: "bg-navy/75", text: "text-ivory" },
    { l: "Medium", n: 6, weight: "bg-slate", text: "text-ivory" },
    { l: "Low", n: 11, weight: "bg-slate/50", text: "text-navy" },
  ];

  const findings = [
    { f: "Missing CSRF token on /admin form", s: "High", status: "Fixed" },
    { f: "Outdated dependency: lodash 4.17.20", s: "Medium", status: "Fixed" },
    { f: "S3 bucket lacks server-side encryption", s: "High", status: "Fixed" },
    { f: "Insecure cookie · missing SameSite", s: "Medium", status: "Open" },
    { f: "Verbose error responses leak stack traces", s: "Medium", status: "Open" },
  ];

  const owasp = [
    { t: "A01 Access control", ok: true },
    { t: "A02 Cryptography", ok: true },
    { t: "A03 Injection", ok: true },
    { t: "A04 Insecure design", ok: false },
    { t: "A05 Misconfiguration", ok: false },
    { t: "A06 Vulnerable comps.", ok: true },
    { t: "A07 Authentication", ok: true },
    { t: "A08 Integrity", ok: true },
    { t: "A09 Logging", ok: false },
    { t: "A10 SSRF", ok: true },
  ];

  return (
    <BrowserFrame url="audit.jns.consulting/report/2026-q4" className="shadow-[0_30px_80px_-40px_rgba(30,42,58,0.25)]">
      <div ref={ref} className="grid grid-cols-12 min-h-[460px] text-navy">
        {/* Left summary */}
        <div className="col-span-5 border-r border-slate-line p-6">
          <p className="text-[0.5625rem] uppercase tracking-[0.18em] text-slate">
            Q4 Security Audit · Acme Hotel
          </p>
          <h4 className="font-display mt-2 text-base tracking-tight">
            Scan complete<span className="text-slate">.</span>
          </h4>

          {/* Risk gauge */}
          <div className="mt-5 flex items-baseline gap-3">
            <p className="font-display text-5xl tracking-tight">
              <motion.span
                initial={{ opacity: 0 }}
                animate={animate ? { opacity: 1 } : undefined}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Low
              </motion.span>
            </p>
            <p className="text-[0.625rem] text-slate">
              residual risk
              <br />
              after remediation
            </p>
          </div>

          {/* Severity breakdown */}
          <div className="mt-6 space-y-1.5">
            {severities.map((sev, i) => (
              <motion.div
                key={sev.l}
                initial={{ opacity: 0, x: -10 }}
                animate={animate ? { opacity: 1, x: 0 } : undefined}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <span className="w-16 text-[0.625rem] uppercase tracking-[0.14em] text-slate">
                  {sev.l}
                </span>
                <div className="flex-1 h-5 bg-cream relative overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={animate ? { width: `${Math.min(sev.n * 8, 100)}%` } : undefined}
                    transition={{ duration: 0.9, delay: 0.5 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                    className={`absolute left-0 top-0 h-full ${sev.weight}`}
                  />
                </div>
                <span className="w-6 text-right font-display text-sm">{sev.n}</span>
              </motion.div>
            ))}
          </div>

          {/* OWASP grid */}
          <div className="mt-8">
            <p className="text-[0.5625rem] uppercase tracking-[0.18em] text-slate">
              OWASP Top 10 · 2021
            </p>
            <div className="mt-3 grid grid-cols-5 gap-1">
              {owasp.map((o, i) => (
                <motion.div
                  key={o.t}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={animate ? { opacity: 1, scale: 1 } : undefined}
                  transition={{ duration: 0.4, delay: 0.6 + i * 0.04 }}
                  title={o.t}
                  className={`aspect-square border ${
                    o.ok
                      ? "border-navy bg-navy/8"
                      : "border-slate bg-cream"
                  } flex items-center justify-center`}
                >
                  {o.ok ? (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5L4.5 7.5L8.5 2.5" stroke="currentColor" className="text-navy" strokeWidth="1.4" strokeLinecap="square" />
                    </svg>
                  ) : (
                    <span className="text-[0.625rem] text-slate">!</span>
                  )}
                </motion.div>
              ))}
            </div>
            <p className="mt-2 text-[0.5625rem] text-slate">
              7 of 10 categories pass · 3 in remediation
            </p>
          </div>
        </div>

        {/* Right: findings list */}
        <div className="col-span-7 p-6">
          <div className="flex items-baseline justify-between">
            <p className="text-[0.5625rem] uppercase tracking-[0.18em] text-slate">
              Findings · sorted by impact
            </p>
            <p className="text-[0.5625rem] text-slate">
              19 total · 14 fixed
            </p>
          </div>

          <ul className="mt-3 divide-y divide-slate-line border-y border-slate-line">
            {findings.map((f, i) => (
              <motion.li
                key={f.f}
                initial={{ opacity: 0, y: 8 }}
                animate={animate ? { opacity: 1, y: 0 } : undefined}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                className="py-3 flex items-center gap-3"
              >
                <span
                  className={`text-[0.5625rem] uppercase tracking-[0.14em] px-1.5 py-0.5 w-16 text-center ${
                    f.s === "High"
                      ? "bg-navy text-ivory"
                      : "bg-slate/40 text-navy"
                  }`}
                >
                  {f.s}
                </span>
                <span className="flex-1 text-[0.75rem] leading-snug">{f.f}</span>
                <span
                  className={`text-[0.5625rem] uppercase tracking-[0.14em] ${
                    f.status === "Fixed" ? "text-navy" : "text-slate"
                  }`}
                >
                  {f.status === "Fixed" ? (
                    <span className="inline-flex items-center gap-1">
                      <svg width="8" height="8" viewBox="0 0 8 8"><path d="M1 4L3 6L7 1.5" stroke="currentColor" strokeWidth="1.2" fill="none" strokeLinecap="square" /></svg>
                      Fixed
                    </span>
                  ) : (
                    "Open"
                  )}
                </span>
              </motion.li>
            ))}
          </ul>

          {/* Remediation progress */}
          <div className="mt-6">
            <div className="flex justify-between text-[0.625rem] text-slate">
              <span className="uppercase tracking-[0.14em]">Remediation</span>
              <span>
                <span className="font-display text-navy">14</span>
                <span className="text-slate"> / 19 complete</span>
              </span>
            </div>
            <div className="mt-2 h-1 bg-cream overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={animate ? { width: "74%" } : undefined}
                transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
                className="h-full bg-navy"
              />
            </div>
          </div>

          <p className="mt-5 text-[0.625rem] text-slate italic">
            Plain-English remediation plan · delivered as a 4-page PDF, not 80.
          </p>
        </div>
      </div>
    </BrowserFrame>
  );
}
