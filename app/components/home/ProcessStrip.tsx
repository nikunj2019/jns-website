import Container from "../Container";
import Reveal, { RevealGroup, RevealItem } from "../Reveal";
import { processSteps } from "./content";

export default function ProcessStrip() {
  return (
    <section id="process" className="bg-cream py-24 sm:py-28 lg:py-32">
      <Container size="wide">
        <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.22em] text-slate">
              Process
            </p>
            <h2 className="font-display mt-5 text-4xl leading-[1.05] tracking-tight sm:text-5xl">
              Listen. Scope. Build. Support.
            </h2>
          </Reveal>
          <Reveal delay={0.08} className="lg:pt-8">
            <p className="text-lg leading-relaxed text-navy/75">
              We start with the messy reality of the business, then ship the
              smallest useful system that creates visibility, action, and
              measurable value.
            </p>
          </Reveal>
        </div>

        <RevealGroup
          className="mt-14 grid gap-px border border-slate-line bg-slate-line md:grid-cols-4"
          stagger={0.08}
        >
          {processSteps.map((step) => (
            <RevealItem key={step.title}>
              <article className="min-h-full bg-cream p-7 lg:p-8">
                <h3 className="font-display text-2xl tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-navy/75">
                  {step.body}
                </p>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}
