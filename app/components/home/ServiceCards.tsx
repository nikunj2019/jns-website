import Link from "next/link";
import Container from "../Container";
import Reveal, { RevealGroup, RevealItem } from "../Reveal";

const services = [
  {
    no: "01",
    title: "AI Voice Agents",
    slug: "ai-voice",
    tagline: "Answers every call. Books every appointment. 24/7.",
    outcome: { value: "68%", label: "of bookings happen outside business hours" },
    included: [
      "Inbound call handling, 24 hours a day",
      "Real-time calendar booking and confirmation",
      "Caller qualification and service matching",
      "SMS confirmation sent automatically",
      "Self-improving call scripts, no manual tuning",
    ],
  },
  {
    no: "02",
    title: "Custom Software",
    slug: "custom-builds",
    tagline: "The command center your business actually runs on.",
    outcome: { value: "1 view", label: "for revenue, bookings, staff, and risk" },
    included: [
      "Owner and operator dashboards",
      "Booking, scheduling, and CRM",
      "Automated invoicing and payment tracking",
      "SMS and email campaign automation",
      "Client, contractor, and staff portals",
    ],
  },
  {
    no: "03",
    title: "Workflow Automation",
    slug: "automation",
    tagline: "The work that runs while you are not looking.",
    outcome: { value: "38 hrs", label: "saved per month, per client, on average" },
    included: [
      "Automated invoicing and payment reminders",
      "SMS and email sequences for bookings and follow-up",
      "Re-engagement campaigns for lapsed clients",
      "Overdue alerts and escalation workflows",
      "POS, payments, and tool integrations",
    ],
  },
];

export default function ServiceCards() {
  return (
    <section id="services-overview" className="bg-cream py-24 sm:py-28 lg:py-36">
      <Container size="wide">
        {/* Intro */}
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <Reveal>
            <p className="brand-eyebrow text-slate flex items-center gap-3">
              <span className="brand-dot" aria-hidden="true" />
              What we build
            </p>
            <h2 className="font-display mt-6 text-4xl leading-[1.05] tracking-tight sm:text-5xl">
              Three things. Done properly.
            </h2>
          </Reveal>
          <Reveal delay={0.08} className="lg:pt-4">
            <p className="text-lg leading-relaxed text-navy/75">
              We do not offer a menu of dozens of services. We do three things
              well, and we build each one specifically for your business, not
              adapted from a template.
            </p>
            <p className="mt-5 text-[0.9375rem] leading-relaxed text-navy/60">
              Every item below is something we have shipped and that a client
              runs on today.
            </p>
          </Reveal>
        </div>

        {/* Cards */}
        <RevealGroup className="mt-16 grid gap-6 sm:grid-cols-1 lg:grid-cols-3 lg:gap-8" stagger={0.1}>
          {services.map((s) => (
            <RevealItem key={s.no}>
              <div className="group flex h-full flex-col bg-ivory rounded-2xl overflow-hidden border border-slate-line transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_60px_-15px_rgba(30,42,58,0.15)] hover:border-slate/50">
                {/* Gradient accent bar */}
                <div className="h-0.5 bg-gradient-to-r from-navy/60 via-slate-soft/30 to-transparent" />
                <div className="flex flex-col flex-1 p-8 lg:p-10">
                  {/* Number + title */}
                  <div>
                    <p className="font-display text-5xl tabular-nums text-slate-line transition-colors duration-300">
                      {s.no}
                    </p>
                    <h3 className="font-display mt-4 text-2xl tracking-tight text-navy lg:text-[1.75rem]">
                      {s.title}
                    </h3>
                    <p className="mt-2 font-display text-base italic leading-snug text-navy/70">
                      {s.tagline}
                    </p>
                  </div>

                  {/* Outcome stat */}
                  <div className="mt-8 border-t border-slate-line pt-6">
                    <p className="font-display text-3xl tracking-tight text-navy">
                      {s.outcome.value}
                    </p>
                    <p className="mt-1 text-sm leading-snug text-slate">
                      {s.outcome.label}
                    </p>
                  </div>

                  {/* Included */}
                  <ul className="mt-8 flex-1 space-y-3">
                    {s.included.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-navy/75">
                        <span className="mt-2 h-px w-3 shrink-0 bg-slate" aria-hidden="true" />
                        {item}
                      </li>
                    ))}
                  </ul>

                  {/* Link */}
                  <div className="mt-8 border-t border-slate-line pt-6">
                    <Link
                      href={`/services#${s.slug}`}
                      className="group/link inline-flex items-center gap-2 text-sm font-medium text-navy transition-colors hover:text-slate"
                    >
                      Full breakdown
                      <span
                        aria-hidden="true"
                        className="transition-transform duration-200 group-hover/link:translate-x-1 inline-block"
                      >
                        &rarr;
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}
