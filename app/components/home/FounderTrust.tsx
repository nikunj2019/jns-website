import Container from "../Container";
import Reveal, { RevealGroup, RevealItem } from "../Reveal";
import { founders } from "./content";

export default function FounderTrust() {
  return (
    <section className="bg-ivory py-24 sm:py-28 lg:py-32">
      <Container size="wide">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.22em] text-slate">
              Founders
            </p>
            <h2 className="font-display mt-5 text-4xl leading-[1.05] tracking-tight sm:text-5xl">
              Built by people who understand software, money, operations, and risk.
            </h2>
          </Reveal>
          <Reveal delay={0.08} className="lg:pt-8">
            <p className="text-lg leading-relaxed text-navy/75">
              JNS is not a generic template shop. The founding team brings the
              lanes a small business owner actually cares about: client
              relationships, application delivery, cyber security, financial
              discipline, and day-to-day operations.
            </p>
          </Reveal>
        </div>

        <RevealGroup
          className="mt-14 grid gap-px border border-slate-line bg-slate-line lg:grid-cols-3"
          stagger={0.1}
        >
          {founders.map((founder) => (
            <RevealItem key={founder.name}>
              <article className="min-h-full bg-ivory p-7 lg:p-9">
                <p className="font-display text-5xl text-slate">
                  {founder.name.charAt(0)}
                </p>
                <h3 className="mt-10 font-display text-3xl tracking-tight">
                  {founder.name}
                </h3>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate">
                  {founder.lane}
                </p>
                <p className="mt-5 text-sm leading-relaxed text-navy/75">
                  {founder.detail}
                </p>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}
