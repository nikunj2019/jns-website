import Container from "../Container";
import Reveal, { RevealGroup, RevealItem } from "../Reveal";
import Button from "../Button";

const projects = [
  {
    industry: "Beauty & Wellness",
    type: "Independent suite-rental salon",
    headline: "A full operating system for an independent beauty studio.",
    description:
      "The owner was managing rent collection, bookings, contractor schedules, and client communication by hand. We replaced the entire patchwork with one system.",
    built: [
      { term: "AI voice receptionist", desc: "answers every call, books appointments 24/7" },
      { term: "Owner dashboard", desc: "revenue, suite occupancy, overdue rent, today's schedule" },
      { term: "Contractor portals", desc: "availability, appointments, client notes, photo uploads" },
      { term: "Client portal", desc: "booking history, upcoming appointments, rebooking" },
      { term: "Automated monthly invoicing", desc: "runs on the 1st, no manual work" },
      { term: "Integrated payments", desc: "connected directly to invoicing and booking" },
    ],
    outcome: "The AI now handles every inbound call. Bookings appear in the dashboard automatically, including calls that come in at 2 am.",
  },
  {
    industry: "Pet Services Franchise",
    type: "Multi-location grooming franchise",
    headline: "Analytics, AI calling, and automated reminders across every location.",
    description:
      "Multiple stores, one POS system, and no visibility into what was actually happening. The owner was flying blind on utilization, retention, and day-to-day performance.",
    built: [
      { term: "AI phone agent", desc: "books grooming appointments end-to-end via voice" },
      { term: "Self-improving AI coach", desc: "reviews every call transcript and refines the phone agent automatically" },
      { term: "Multi-location analytics", desc: "revenue, groomer utilization, and retention per store" },
      { term: "Breed-aware reminders", desc: "re-engagement timed to each dog's grooming cycle" },
      { term: "POS integration", desc: "live appointment and sales data, no manual exports" },
      { term: "Multi-role portal", desc: "owner, manager, and associate views with role-based access" },
    ],
    outcome: "The AI coach analyzes every call and rewrites the phone agent's own script to fix what didn't work. It improves itself with zero human input.",
  },
];

export default function WorkShowcase() {
  return (
    <section id="work-we-do" className="bg-ivory py-14 sm:py-24 lg:py-36">
      <Container size="wide">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.22em] text-slate">
            What we've shipped
          </p>
          <h2 className="font-display mt-5 max-w-3xl text-4xl leading-[1.05] tracking-tight sm:text-5xl">
            Real software, running real businesses.
          </h2>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-navy/75">
            Every engagement is custom. Here are two examples of what that looks like in practice.
          </p>
        </Reveal>

        <RevealGroup className="mt-16 grid gap-px border border-slate-line bg-slate-line lg:grid-cols-2" stagger={0.1}>
          {projects.map((project) => (
            <RevealItem key={project.industry}>
              <article className="flex h-full flex-col bg-ivory p-5 sm:p-8 lg:p-10">
                <div>
                  <p className="brand-eyebrow text-slate">{project.industry}</p>
                  <p className="mt-1 text-xs text-slate/70">{project.type}</p>
                </div>

                <h3 className="font-display mt-6 text-2xl leading-tight tracking-tight sm:text-3xl">
                  {project.headline}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-navy/70">
                  {project.description}
                </p>

                <div className="mt-8">
                  <p className="brand-eyebrow text-slate">What we built</p>
                  <ul className="mt-4 space-y-3">
                    {project.built.map((item) => (
                      <li key={item.term} className="group flex gap-3 text-sm">
                        <span
                          className="mt-2 h-px w-4 shrink-0 bg-slate transition-all duration-300 group-hover:w-7 group-hover:bg-navy"
                          aria-hidden="true"
                        />
                        <span className="leading-relaxed text-navy/80">
                          <span className="font-medium text-navy">{item.term}</span>
                          <span className="text-navy/65">: {item.desc}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <blockquote className="mt-8 border-l-2 border-navy pl-5">
                  <p className="text-sm leading-relaxed text-navy/80 italic">
                    &ldquo;{project.outcome}&rdquo;
                  </p>
                </blockquote>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal className="mt-10">
          <Button href="/contact" size="lg">
            Tell us what you're building
          </Button>
        </Reveal>
      </Container>
    </section>
  );
}
