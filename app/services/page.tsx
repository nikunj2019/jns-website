import type { Metadata } from "next";
import Container from "../components/Container";
import Button from "../components/Button";
import SectionLabel from "../components/SectionLabel";
import Reveal, { RevealGroup, RevealItem } from "../components/Reveal";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Operate, grow, and protect your small business with custom command centers, CRM workflows, marketing systems, and security reviews.",
};

type Service = {
  number: string;
  slug: string;
  title: string;
  lede: string;
  summary: string;
  included: string[];
  goodFor: string;
};

const SERVICES: Service[] = [
  {
    number: "01",
    slug: "custom-builds",
    title: "Operate",
    lede: "KPI dashboards, CRM workflows, and AI actions.",
    summary:
      "We build the command center your business runs on: KPI dashboards, CRM pipelines, customer portals, booking systems, internal tools, and AI workflows for follow-up, email triage, document extraction, reporting, and task routing.",
    included: [
      "Performance dashboard — revenue, leads, bookings, work status, and operational KPIs",
      "CRM pipeline — lead source, deal value, owner, probability, next step, notes",
      "Action center — recommended follow-ups, automations, invoice reminders, and workflow fixes",
      "AI workflows — summaries, draft replies, lead scoring, document extraction, routing",
      "Handoff — source code, documentation, admin access, and a clean operations runbook",
    ],
    goodFor:
      "You cannot see performance clearly, leads are slipping through cracks, or your team is copying data between tools that should already talk to each other.",
  },
  {
    number: "02",
    slug: "marketing",
    title: "Grow",
    lede: "Paid growth connected to real business outcomes.",
    summary:
      "Google Ads and Meta Ads campaigns built around what you actually sell, then connected back to your command center. Spend, leads, conversion rates, booked work, ROAS, and weak campaigns become visible in one place.",
    included: [
      "Account audit — what's running, what's working, what's bleeding",
      "Tracking setup — pixels, conversions, GA4, and server-side events done correctly",
      "Campaign architecture — search, performance max, Meta, retargeting, and tests",
      "Landing-page experiments — message, offer, form, and conversion improvements",
      "Growth dashboard — spend, leads, CPA, ROAS, revenue, and recommended actions",
    ],
    goodFor:
      "You are spending on ads but cannot connect that spend to pipeline, bookings, signed deals, or revenue.",
  },
  {
    number: "03",
    slug: "security",
    title: "Protect",
    lede: "Security visibility small businesses can act on.",
    summary:
      "Web application and infrastructure security reviews written for owners, not auditors. We find the holes, rank them by impact, and turn them into a plain-English security center with remediation status and next actions.",
    included: [
      "Web application security review — OWASP Top 10, auth flows, data handling",
      "Infrastructure review — cloud configuration, access controls, secrets management",
      "Vendor and SaaS audit — who can see what, and should they?",
      "Security dashboard — risk score, open findings, patches, access review, remediation",
      "Optional retainer — quarterly review, incident response on call",
    ],
    goodFor:
      "You handle customer data, payment information, or PII; you need to answer client security questions; or nobody has reviewed the system yet.",
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
              Operate. Grow. Protect.
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-navy/75 sm:text-xl">
              The command center, growth engine, and security posture your small
              business needs to see performance clearly and act faster.
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
                  <p className="text-xs uppercase tracking-[0.22em] text-slate">
                    {s.title}
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
                    {s.included.map((item) => {
                      const [head, ...rest] = item.split(" — ");
                      const tail = rest.join(" — ");
                      return (
                        <RevealItem key={item}>
                          <div className="py-4 flex gap-4">
                            <span className="mt-3 h-px w-4 shrink-0 bg-slate" aria-hidden="true" />
                            <p className="text-[0.9375rem] leading-relaxed text-navy/85">
                              <span className="font-medium text-navy">{head}</span>
                              {tail && (
                                <>
                                  <span className="text-slate"> — </span>
                                  {tail}
                                </>
                              )}
                            </p>
                          </div>
                        </RevealItem>
                      );
                    })}
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
              { t: "Handoff", b: "Source code, docs, access. We're available — never needed." },
            ].map((step) => (
              <RevealItem key={step.t}>
                <div className="bg-navy p-8 lg:p-10 h-full">
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
