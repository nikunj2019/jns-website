import type { Metadata } from "next";
import Container from "../components/Container";
import Button from "../components/Button";
import SectionLabel from "../components/SectionLabel";
import Reveal, { RevealGroup, RevealItem } from "../components/Reveal";

export const metadata: Metadata = {
  title: "About",
  description:
    "JNS Consulting was founded by Nikunj Jadawala, Jiten Patel, and Shayar Patel: an application security engineer, a financial auditor, and a hospitality operator.",
};

const FOUNDERS = [
  {
    initial: "J",
    name: "Jiten Patel",
    role: "Co-Founder",
    specialties: ["Operations", "Strategy", "Business Process Optimization"],
  },
  {
    initial: "N",
    name: "Nikunj Jadawala",
    role: "Co-Founder",
    specialties: ["Technology", "Product Development", "AI Solutions"],
  },
  {
    initial: "S",
    name: "Shayar Patel",
    role: "Co-Founder",
    specialties: ["Growth", "Client Success", "Business Development"],
  },
];

const WHY_JNS = [
  { n: "01", label: "Practical AI Solutions" },
  { n: "02", label: "Custom Web & Mobile Development" },
  { n: "03", label: "Process Automation" },
  { n: "04", label: "Affordable Small Business Technology" },
  { n: "05", label: "Long-Term Partnership" },
];

export default function AboutPage() {
  return (
    <>
      {/* HEADER */}
      <section className="border-b border-slate-line">
        <Container size="wide" className="pt-14 pb-16 sm:pt-24 sm:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
            <Reveal className="lg:col-span-7">
              <SectionLabel>About JNS</SectionLabel>
              <h1 className="font-display mt-8 text-[2.5rem] leading-[1.05] tracking-tight sm:text-[3.5rem] lg:text-[4.5rem]">
                The Team Behind JNS
              </h1>
            </Reveal>
            <Reveal delay={0.15} className="lg:col-span-5 lg:pl-8">
              <p className="text-lg leading-relaxed text-navy/75">
                JNS was founded to help small businesses operate smarter, grow
                faster, and solve real-world challenges through practical
                technology, automation, and AI solutions.
              </p>
              <p className="mt-4 text-lg leading-relaxed text-navy/75">
                We believe technology should fit the way you already work — not
                force you to change everything.
              </p>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* FOUNDERS */}
      <section className="py-14 sm:py-24">
        <Container size="wide">
          <Reveal className="text-center mb-16">
            <SectionLabel className="tracking-[0.3em]">Three Founders. One Mission.</SectionLabel>
          </Reveal>

          <RevealGroup
            className="grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-14"
            stagger={0.12}
          >
            {FOUNDERS.map((f) => (
              <RevealItem key={f.name}>
                <article className="flex flex-col items-center text-center">
                  {/* Circular avatar */}
                  <div className="relative w-44 h-44 rounded-full bg-cream border border-slate-line/60 overflow-hidden flex items-center justify-center">
                    <span className="font-display text-[7rem] leading-none text-navy/20 select-none">
                      {f.initial}
                    </span>
                  </div>

                  <h3 className="font-display mt-7 text-2xl leading-tight tracking-tight">
                    {f.name}
                  </h3>
                  <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate">
                    {f.role}
                  </p>

                  <div className="mt-5 h-px w-10 bg-slate-line" />

                  <ul className="mt-5 space-y-1">
                    {f.specialties.map((s) => (
                      <li key={s} className="text-sm text-navy/70">
                        {s}
                      </li>
                    ))}
                  </ul>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </section>

      {/* WHY JNS */}
      <section className="bg-cream py-12 sm:py-20">
        <Container size="wide">
          <Reveal className="text-center mb-14">
            <SectionLabel className="tracking-[0.3em]">Why Businesses Choose JNS</SectionLabel>
          </Reveal>

          <RevealGroup
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8"
            stagger={0.08}
          >
            {WHY_JNS.map((item) => (
              <RevealItem key={item.n}>
                <div className="flex flex-col items-center text-center gap-3">
                  <p className="font-display text-3xl text-slate-line">{item.n}</p>
                  <p className="text-sm leading-snug text-navy/80">{item.label}</p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </section>

      {/* CTA */}
      <section className="bg-navy text-ivory">
        <Container size="wide" className="py-14 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <Reveal className="lg:col-span-8">
              <h2 className="font-display text-4xl sm:text-5xl leading-[1.05] tracking-tight">
                Hire the firm. Talk to the founders.
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-soft">
                The names on the door are the names you&apos;ll be working with.
              </p>
            </Reveal>
            <Reveal delay={0.15} className="lg:col-span-4 flex lg:justify-end">
              <Button
                href="/contact"
                size="lg"
                variant="secondary"
                className="bg-ivory text-navy border-ivory hover:bg-transparent hover:text-ivory"
              >
                Start the conversation
              </Button>
            </Reveal>
          </div>
        </Container>
      </section>
    </>
  );
}
