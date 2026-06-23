import type { Metadata } from "next";
import Container from "../components/Container";
import Button from "../components/Button";
import SectionLabel from "../components/SectionLabel";
import Reveal, { RevealGroup, RevealItem } from "../components/Reveal";

export const metadata: Metadata = {
  title: "Services",
  description:
    "AI voice agents, custom software, and workflow automation built for small businesses. Phone agents that book on their own, command centers you actually run on, and automations that run in the background.",
};

type Included = { term: string; desc: string };

type Service = {
  number: string;
  slug: string;
  title: string;
  lede: string;
  summary: string;
  included: Included[];
  goodFor: string;
};

const SERVICES: Service[] = [
  {
    number: "01",
    slug: "ai-voice",
    title: "AI Voice Agents",
    lede: "Phone agents that answer, qualify, and book on their own.",
    summary:
      "An AI receptionist that handles inbound calls around the clock, matches each caller to the right service, and writes confirmed bookings straight into your system. No voicemail, no missed revenue, no human in the loop. Two of our clients run this in production today.",
    included: [
      {
        term: "AI receptionist",
        desc: "answers inbound calls day and night, never sends a caller to voicemail",
      },
      {
        term: "Smart booking",
        desc: "matches callers to the right service and writes confirmed appointments automatically",
      },
      {
        term: "Self-improving coach",
        desc: "reviews call transcripts and refines the agent on its own, with no manual tuning",
      },
      {
        term: "Real-time CRM sync",
        desc: "every call logged and every booking pushed into your system as it happens",
      },
      {
        term: "Custom voice and script",
        desc: "tuned to your business, your services, and the way you talk to customers",
      },
    ],
    goodFor:
      "You miss calls after hours, your team is buried on the phone, or you are losing bookings you never even hear about.",
  },
  {
    number: "02",
    slug: "custom-builds",
    title: "Custom Software",
    lede: "The command center your business actually runs on.",
    summary:
      "Owner dashboards, booking systems, CRM pipelines, client and staff portals, and the automations that tie them together. Built around how your business operates and connected to the tools you already use.",
    included: [
      {
        term: "Owner dashboard",
        desc: "revenue, occupancy, outstanding balances, and the day's schedule in one view",
      },
      {
        term: "Booking and CRM",
        desc: "appointments, client history, staff availability, and automated reminders",
      },
      {
        term: "Client and staff portals",
        desc: "self-serve scheduling, notes, approvals, and role-based access",
      },
      {
        term: "Automations",
        desc: "invoicing, SMS reminders, overdue alerts, and re-engagement that run on their own",
      },
      {
        term: "Integrations",
        desc: "your POS, payments, and existing tools connected into one system",
      },
      {
        term: "Clean handoff",
        desc: "source code, documentation, admin access, and an operations runbook",
      },
    ],
    goodFor:
      "You cannot see performance clearly, work is slipping through the cracks, or your team copies data between tools that should already talk to each other.",
  },
  {
    number: "03",
    slug: "automation",
    title: "Workflow Automation",
    lede: "The work that runs while you are not looking.",
    summary:
      "The invisible layer that ties your business together. Invoices go out automatically. Overdue clients get a nudge. Lapsed customers come back. Your tools stop needing a human in the middle. We design, build, and test the sequences so they run without you.",
    included: [
      {
        term: "Automated invoicing",
        desc: "monthly or per-service billing sent on schedule, no manual work",
      },
      {
        term: "SMS and email reminders",
        desc: "appointment confirmations, day-before reminders, and no-show follow-ups",
      },
      {
        term: "Re-engagement sequences",
        desc: "targeted outreach to clients who have not been back in 30, 60, or 90 days",
      },
      {
        term: "Overdue alerts",
        desc: "escalating reminders for unpaid invoices with automatic follow-up",
      },
      {
        term: "Tool integrations",
        desc: "your POS, booking system, payments, and CRM connected so data moves without you",
      },
      {
        term: "Monitoring and updates",
        desc: "we watch the sequences and adjust them as your business changes",
      },
    ],
    goodFor:
      "You are sending reminders by hand, copying data between tools, or losing revenue because follow-up does not happen consistently.",
  },
];

export default function ServicesPage() {
  return (
    <>
      {/* PAGE HEADER */}
      <section className="border-b border-slate-line">
        <Container size="wide" className="pt-20 pb-20 sm:pt-28 sm:pb-28">
          <Reveal>
            <SectionLabel>Services</SectionLabel>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="font-display mt-8 text-[2.5rem] leading-[1.05] tracking-tight sm:text-[3.5rem] lg:text-[4.5rem] max-w-4xl">
              Answer. Operate. Automate.
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-navy/75 sm:text-xl">
              AI voice agents that never miss a call, custom software your
              business runs on, and automations that handle the repetitive work
              in the background.
            </p>
          </Reveal>
        </Container>
      </section>

      {/* SERVICES — detailed */}
      {SERVICES.map((s, idx) => (
        <section
          key={s.slug}
          id={s.slug}
          className={`${idx % 2 === 1 ? "bg-cream" : ""} scroll-mt-24`}
        >
          <Container size="wide" className="py-28 sm:py-36">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
              {/* Left: heading */}
              <Reveal direction="up" className="lg:col-span-5">
                <div className="lg:sticky lg:top-28">
                  <p className="font-display text-5xl text-slate-soft tabular-nums">
                    {s.number}
                  </p>
                  <h2 className="font-display mt-6 text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.05] tracking-tight">
                    {s.title}
                  </h2>
                  <p className="font-display italic mt-6 text-xl text-slate leading-snug">
                    {s.lede}
                  </p>
                </div>
              </Reveal>

              {/* Right: details */}
              <div className="lg:col-span-7">
                <Reveal>
                  <p className="text-lg leading-relaxed text-navy/85">
                    {s.summary}
                  </p>
                </Reveal>

                <div className="mt-12">
                  <Reveal>
                    <p className="brand-eyebrow text-slate">What&apos;s included</p>
                  </Reveal>
                  <RevealGroup
                    className="mt-6 divide-y divide-slate-line/70 border-y border-slate-line/70"
                    stagger={0.06}
                  >
                    {s.included.map((item) => (
                      <RevealItem key={item.term}>
                        <div className="group py-4 flex gap-4">
                          <span
                            className="mt-3 h-px w-4 shrink-0 bg-slate transition-all duration-300 group-hover:w-7 group-hover:bg-navy"
                            aria-hidden="true"
                          />
                          <p className="text-[0.9375rem] leading-relaxed text-navy/85">
                            <span className="font-medium text-navy">
                              {item.term}
                            </span>
                            <span className="text-slate">: </span>
                            {item.desc}
                          </p>
                        </div>
                      </RevealItem>
                    ))}
                  </RevealGroup>
                </div>

                <Reveal delay={0.05}>
                  <div className="mt-12 border-l-2 border-navy pl-6">
                    <p className="brand-eyebrow text-slate">Good fit if</p>
                    <p className="mt-3 text-[0.9375rem] leading-relaxed text-navy/85">
                      {s.goodFor}
                    </p>
                  </div>
                </Reveal>

                <Reveal delay={0.1}>
                  <div className="mt-12">
                    <Button href="/contact" size="md">
                      Start the conversation
                    </Button>
                  </div>
                </Reveal>
              </div>
            </div>
          </Container>
        </section>
      ))}

      {/* ENGAGEMENT MODEL */}
      <section className="bg-navy text-ivory">
        <Container size="wide" className="py-28 sm:py-36">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
            <Reveal className="lg:col-span-5">
              <p className="brand-eyebrow text-slate-soft flex items-center gap-3">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-ivory" aria-hidden="true" />
                How we work
              </p>
              <h2 className="font-display mt-6 text-4xl sm:text-5xl leading-[1.05] tracking-tight">
                Discovery. Proposal. Build. Done.
              </h2>
            </Reveal>
            <Reveal delay={0.1} className="lg:col-span-6 lg:col-start-7 flex items-end">
              <p className="text-lg leading-relaxed text-slate-soft">
                We don&apos;t bill by the hour. We don&apos;t hide behind retainers
                with no exit. Every engagement starts with a fixed scope and a
                fixed fee, agreed before any work begins.
              </p>
            </Reveal>
          </div>

          <RevealGroup
            className="grid grid-cols-1 md:grid-cols-4 gap-px bg-ivory/15 border border-ivory/15"
            stagger={0.08}
          >
            {[
              { t: "Discovery call", b: "30 minutes. We listen, you describe the problem. Free." },
              { t: "Written proposal", b: "Scope, deliverables, timeline, fixed fee. Usually within 3 days." },
              { t: "Build", b: "Weekly written updates. No surprises. You always know where it stands." },
              { t: "Handoff", b: "Source code, docs, access. We stay available, never required." },
            ].map((step) => (
              <RevealItem key={step.t}>
                <div className="bg-navy p-8 lg:p-10 h-full transition-colors hover:bg-navy-700">
                  <h3 className="font-display text-xl leading-tight">{step.t}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-soft">{step.b}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </section>
    </>
  );
}
