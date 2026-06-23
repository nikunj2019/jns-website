"use client";

import { motion } from "motion/react";
import Container from "../Container";
import Reveal, { RevealGroup, RevealItem } from "../Reveal";
import Button from "../Button";
import AuroraGlow from "../AuroraGlow";

const capabilities = [
  {
    title: "Always on",
    body: "Answers every call, evenings, weekends, and holidays. No voicemail, no missed bookings.",
  },
  {
    title: "Self-improving",
    body: "An AI coach reviews every call transcript and patches the agent's script automatically. It gets better with zero human input.",
  },
  {
    title: "Fully integrated",
    body: "Writes confirmed bookings directly to your CRM or calendar. No human in the loop between call and appointment.",
  },
  {
    title: "Sounds human",
    body: "Callers ask questions, change their mind, give the wrong name. The agent handles it, naturally.",
  },
];

const callLog = [
  { time: "11:42 pm", label: "Inbound call", note: "New client asked about availability Saturday" },
  { time: "11:43 pm", label: "Booking created", note: "Saturday 10 am, auto-confirmed and added to CRM" },
  { time: "11:43 pm", label: "SMS sent", note: "Confirmation and reminder link sent to caller" },
  { time: "12:04 am", label: "Inbound call", note: "Existing client, reschedule request" },
  { time: "12:05 am", label: "Booking updated", note: "Moved to Monday 2 pm, calendar updated" },
  { time: "2:17 am", label: "Inbound call", note: "General inquiry: hours, pricing, location" },
];

export default function AICalling() {
  return (
    <section className="relative overflow-hidden bg-navy py-24 text-ivory sm:py-28 lg:py-36">
      <AuroraGlow />
      <Container size="wide" className="relative">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20 lg:items-start">
          {/* Left */}
          <div>
            <Reveal>
              <p className="brand-eyebrow text-slate-soft flex items-center gap-3">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-ivory" aria-hidden="true" />
                AI Voice Agents
              </p>
              <h2 className="font-display mt-6 text-4xl leading-[1.05] tracking-tight sm:text-5xl">
                Your phone never goes unanswered again.
              </h2>
              <p className="mt-7 text-lg leading-relaxed text-slate-soft">
                We build AI voice agents that answer calls, match callers to
                the right person or service, and create confirmed bookings
                with no human in the loop. Two of our clients are running these
                in production today.
              </p>
            </Reveal>

            <RevealGroup className="mt-12 grid gap-px border border-ivory/15 bg-ivory/15 sm:grid-cols-2" stagger={0.08}>
              {capabilities.map((cap) => (
                <RevealItem key={cap.title}>
                  <div className="bg-navy p-6">
                    <h3 className="font-display text-xl tracking-tight">{cap.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-soft">{cap.body}</p>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>

            <Reveal delay={0.2}>
              <div className="mt-10">
                <Button
                  href="/contact"
                  size="lg"
                  variant="secondary"
                  className="border-ivory bg-ivory text-navy hover:bg-transparent hover:text-ivory"
                >
                  Talk to us about AI calling
                </Button>
              </div>
            </Reveal>
          </div>

          {/* Right — live call log mock */}
          <Reveal delay={0.14} direction="up" distance={32}>
            <div className="border border-ivory/15 bg-ivory/5 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.7)] backdrop-blur-sm">
              <div className="border-b border-ivory/15 px-5 py-4">
                <p className="text-[0.65rem] uppercase tracking-[0.22em] text-slate-soft">
                  AI Receptionist · Live call log
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <motion.span
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    className="inline-block w-1.5 h-1.5 rounded-full bg-green-400"
                    aria-hidden="true"
                  />
                  <p className="text-xs text-slate-soft">Active · handling calls</p>
                </div>
              </div>

              <div className="divide-y divide-ivory/10">
                {callLog.map((entry, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.08 }}
                    className="grid grid-cols-[4.5rem_1fr] gap-4 px-5 py-4"
                  >
                    <span className="text-xs text-slate-soft/70 pt-0.5 tabular-nums">{entry.time}</span>
                    <div>
                      <p className="text-sm font-medium text-ivory">{entry.label}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-slate-soft">{entry.note}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="border-t border-ivory/15 px-5 py-4">
                <p className="text-xs text-slate-soft/60">
                  All entries above occurred while the business was closed.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
