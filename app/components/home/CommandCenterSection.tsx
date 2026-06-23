import Container from "../Container";
import Reveal, { RevealGroup, RevealItem } from "../Reveal";

const modules = [
  {
    no: "01",
    title: "AI Voice Agent",
    value: "Answers every call. Books every appointment. 24/7.",
    detail:
      "An AI receptionist that handles inbound calls, matches each caller to the right service, and writes confirmed bookings straight into your system, including the calls that come in at 2 a.m. Two of our clients run this in production today.",
    tag: "Flagship",
  },
  {
    no: "02",
    title: "Owner Dashboard",
    value: "The whole business in one calm view.",
    detail:
      "Revenue, occupancy, outstanding balances, and today's schedule, surfaced the way you actually think about the business, not buried in a generic reporting tool.",
  },
  {
    no: "03",
    title: "Booking & CRM",
    value: "Every client tracked. Every follow-up scheduled.",
    detail:
      "Appointments, service history, staff availability, and automated reminders, all connected so leads don't go cold and regulars don't slip away unnoticed.",
  },
  {
    no: "04",
    title: "Automations",
    value: "The work that runs without you.",
    detail:
      "Monthly invoicing, SMS reminders, overdue alerts, and re-engagement sequences, scheduled, tested, and running quietly in the background while you focus on the work.",
  },
  {
    no: "05",
    title: "Analytics",
    value: "Clarity across every location.",
    detail:
      "Revenue, staff utilization, and customer retention aggregated from your POS and operations data into a single view, across every location you run.",
  },
  {
    no: "06",
    title: "Security & Compliance",
    value: "Risk you can see, ranked, and act on.",
    detail:
      "Application and infrastructure reviews written for owners, not auditors. We find the holes, rank them by impact, and turn them into a plain-language plan with remediation status you can track.",
  },
];

export default function CommandCenterSection() {
  return (
    <section id="command-center" className="bg-cream py-24 sm:py-28 lg:py-36">
      <Container size="wide">
        {/* Intro */}
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <Reveal>
            <p className="brand-eyebrow text-slate flex items-center gap-3">
              <span className="brand-dot" aria-hidden="true" />
              The platform
            </p>
            <h2 className="font-display mt-6 text-4xl leading-[1.05] tracking-tight sm:text-5xl">
              One system. Every part of the business.
            </h2>
          </Reveal>
          <Reveal delay={0.08} className="lg:pt-4">
            <p className="text-lg leading-relaxed text-navy/75">
              We don&apos;t sell a template dashboard. We design and build the
              modules your business runs on, wired together, branded to you,
              and shaped around how you actually operate.
            </p>
            <p className="mt-5 text-[0.9375rem] leading-relaxed text-navy/60">
              Every module below is something we have shipped for a real client.
              Not a demo. Not a roadmap. Software running a business today.
            </p>
          </Reveal>
        </div>

        {/* Modules — editorial numbered list */}
        <RevealGroup
          className="mt-16 border-t border-slate-line"
          stagger={0.08}
        >
          {modules.map((m) => (
            <RevealItem key={m.no}>
              <article className="group relative grid grid-cols-1 gap-6 border-b border-slate-line py-9 transition-colors duration-300 hover:bg-ivory/60 lg:grid-cols-[auto_0.9fr_1.1fr] lg:items-baseline lg:gap-12 lg:px-6">
                {/* Animated left accent bar */}
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-9 bottom-9 w-0.5 origin-top scale-y-0 bg-navy transition-transform duration-500 ease-out group-hover:scale-y-100"
                />
                <p className="font-display text-3xl tabular-nums text-slate-soft transition-colors duration-300 group-hover:text-navy lg:text-4xl">
                  {m.no}
                </p>

                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-display text-2xl tracking-tight transition-transform duration-300 group-hover:translate-x-1 lg:text-[1.75rem]">
                      {m.title}
                    </h3>
                    {m.tag && (
                      <span className="border border-navy/20 bg-navy/5 px-2 py-0.5 text-[0.625rem] uppercase tracking-[0.16em] text-navy/70">
                        {m.tag}
                      </span>
                    )}
                  </div>
                  <p className="mt-3 font-display text-lg italic leading-snug text-navy/80">
                    {m.value}
                  </p>
                </div>

                <p className="text-[0.9375rem] leading-relaxed text-navy/70">
                  {m.detail}
                </p>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}
