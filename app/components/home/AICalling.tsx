"use client";

import { motion } from "motion/react";
import Container from "../Container";
import Reveal, { RevealGroup, RevealItem } from "../Reveal";
import Button from "../Button";
import AuroraGlow from "../AuroraGlow";

const valueProps = [
  {
    title: "Always on",
    body: "Answers in under two rings, every evening, weekend, and holiday. No voicemail, no missed bookings.",
  },
  {
    title: "Sounds human",
    body: "Natural, conversational, not robotic. Callers change their mind, talk over it, give the wrong name. It keeps up.",
  },
  {
    title: "Books on its own",
    body: "Checks real availability and writes the confirmed appointment straight into your calendar and CRM.",
  },
  {
    title: "Improves itself",
    body: "Reviews its own call transcripts and refines the script automatically, with no manual tuning from you.",
  },
];

// A full booking call, handled start to finish with no human in the loop.
const transcript = [
  { who: "ai", text: "Thanks for calling Studio Maven, this is the front desk. How can I help?" },
  { who: "caller", text: "Hi, do you have anything open for a haircut and color this Saturday?" },
  { who: "ai", text: "Let me check. Saturday I have 10:00 AM or 2:30 PM with Maria. Would either of those work?" },
  { who: "caller", text: "2:30 is perfect." },
  { who: "ai", text: "Great. Can I grab your name and a cell number for the confirmation?" },
  { who: "caller", text: "Jordan Reyes, 312-555-0182." },
  { who: "ai", text: "You're all set, Jordan. Saturday at 2:30 PM with Maria for a haircut and color. I just texted you a confirmation with a reschedule link. Anything else?" },
  { who: "caller", text: "That's everything, thanks!" },
  { who: "ai", text: "Have a great day." },
];

const outcomes = [
  ["58s", "call to confirmed booking"],
  ["2:30 PM Sat", "written to the calendar"],
  ["1 SMS", "confirmation sent automatically"],
  ["0", "staff involved"],
];

export default function AICalling() {
  return (
    <section className="relative overflow-hidden bg-navy py-24 text-ivory sm:py-28 lg:py-36">
      <AuroraGlow />
      <Container size="wide" className="relative">
        {/* Heading */}
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <Reveal>
            <p className="brand-eyebrow text-slate-soft flex items-center gap-3">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-ivory" aria-hidden="true" />
              AI Voice Agents
            </p>
            <h2 className="font-display mt-6 text-4xl leading-[1.04] tracking-tight sm:text-5xl lg:text-[3.5rem]">
              Your phone never goes unanswered again.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="text-lg leading-relaxed text-slate-soft">
              Every call that goes to voicemail is a booking someone else gets.
              Our AI receptionist answers, qualifies, and books, with no human in
              the loop. Here is a real call it handled, start to finish.
            </p>
          </Reveal>
        </div>

        {/* Demo + value */}
        <div className="mt-14 grid gap-10 lg:grid-cols-[1.12fr_0.88fr] lg:gap-12">
          {/* Transcript — the proof */}
          <Reveal direction="up" distance={32}>
            <div className="border border-ivory/15 bg-ivory/5 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.7)] backdrop-blur-sm">
              {/* Call header */}
              <div className="flex items-center justify-between gap-4 border-b border-ivory/15 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <motion.span
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    className="inline-block h-2 w-2 rounded-full bg-green-400"
                    aria-hidden="true"
                  />
                  <p className="text-[0.7rem] uppercase tracking-[0.2em] text-slate-soft">
                    Inbound call · Sample
                  </p>
                </div>
                <p className="text-xs tabular-nums text-slate-soft/70">00:58</p>
              </div>

              {/* Conversation */}
              <RevealGroup className="space-y-3 px-5 py-6" stagger={0.14} amount={0.1}>
                {transcript.map((line, i) => (
                  <RevealItem key={i} direction="up" distance={12}>
                    <div className={line.who === "ai" ? "flex justify-end" : "flex justify-start"}>
                      <div className="max-w-[82%]">
                        <p
                          className={`mb-1 text-[0.6rem] uppercase tracking-[0.18em] ${
                            line.who === "ai" ? "text-right text-ivory/60" : "text-slate-soft/60"
                          }`}
                        >
                          {line.who === "ai" ? "JNS AI" : "Caller"}
                        </p>
                        <div
                          className={
                            line.who === "ai"
                              ? "bg-ivory px-4 py-2.5 text-sm leading-relaxed text-navy"
                              : "border border-ivory/15 bg-ivory/[0.06] px-4 py-2.5 text-sm leading-relaxed text-slate-soft"
                          }
                        >
                          {line.text}
                        </div>
                      </div>
                    </div>
                  </RevealItem>
                ))}
              </RevealGroup>

              {/* Outcome footer */}
              <div className="grid grid-cols-2 gap-px border-t border-ivory/15 bg-ivory/10 sm:grid-cols-4">
                {outcomes.map(([value, label]) => (
                  <div key={label} className="bg-navy px-4 py-4">
                    <p className="font-display text-xl tracking-tight text-ivory">{value}</p>
                    <p className="mt-1 text-[0.7rem] leading-snug text-slate-soft">{label}</p>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-soft/70">
              A real booking flow, handled with no human in the loop. Your agent is
              scripted to your services, your hours, and your voice.
            </p>
          </Reveal>

          {/* Value props */}
          <div>
            <RevealGroup className="grid gap-px border border-ivory/15 bg-ivory/15" stagger={0.08}>
              {valueProps.map((cap) => (
                <RevealItem key={cap.title}>
                  <div className="bg-navy p-6 transition-colors hover:bg-navy-700">
                    <h3 className="font-display text-xl tracking-tight">{cap.title}</h3>
                    <p className="mt-2.5 text-sm leading-relaxed text-slate-soft">{cap.body}</p>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>

            <Reveal delay={0.15}>
              <div className="mt-8">
                <Button
                  href="/contact"
                  size="lg"
                  variant="secondary"
                  className="w-full border-ivory bg-ivory text-navy hover:bg-transparent hover:text-ivory sm:w-auto"
                >
                  Hear it on your own line
                </Button>
                <p className="mt-3 text-xs leading-relaxed text-slate-soft/70">
                  We will set up a live agent for your business and call you, so
                  you can hear exactly what your customers would.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
