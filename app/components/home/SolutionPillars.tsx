import Button from "../Button";
import Container from "../Container";
import Reveal, { RevealGroup, RevealItem } from "../Reveal";
import { pillars } from "./content";

export default function SolutionPillars() {
  return (
    <section id="work-we-do" className="bg-ivory py-24 sm:py-28 lg:py-36">
      <Container size="wide">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.22em] text-slate">
              Work we do
            </p>
            <h2 className="font-display mt-5 max-w-2xl text-4xl leading-[1.05] tracking-tight sm:text-5xl">
              Operate. Grow. Protect.
            </h2>
          </Reveal>
          <Reveal delay={0.08} className="lg:pt-8">
            <p className="text-lg leading-relaxed text-navy/75">
              These are not separate departments. For small businesses, they are
              one operating system: the tool you run, the customers you win, and
              the risks you control.
            </p>
          </Reveal>
        </div>

        <RevealGroup
          className="mt-14 grid gap-px border border-slate-line bg-slate-line lg:grid-cols-3"
          stagger={0.09}
        >
          {pillars.map((pillar) => (
            <RevealItem key={pillar.title}>
              <article className="flex min-h-full flex-col bg-ivory p-7 transition-colors hover:bg-cream/55 lg:p-9">
                <p className="text-xs uppercase tracking-[0.2em] text-slate">
                  {pillar.title}
                </p>
                <h3 className="font-display mt-5 text-3xl leading-tight tracking-tight">
                  {pillar.subtitle}
                </h3>
                <p className="mt-5 text-sm leading-relaxed text-navy/75">
                  {pillar.body}
                </p>
                <div className="mt-8 grid gap-2">
                  {pillar.examples.map((example) => (
                    <div
                      key={example}
                      className="border border-slate-line bg-cream/35 px-3 py-2 text-sm text-navy/80"
                    >
                      {example}
                    </div>
                  ))}
                </div>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal className="mt-10">
          <Button href="/services" variant="secondary" size="lg">
            Explore services
          </Button>
        </Reveal>
      </Container>
    </section>
  );
}
