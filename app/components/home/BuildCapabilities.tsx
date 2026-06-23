import Container from "../Container";
import Reveal, { RevealGroup, RevealItem } from "../Reveal";
import { capabilities } from "./content";

export default function BuildCapabilities() {
  return (
    <section className="bg-navy py-24 text-ivory sm:py-28 lg:py-32">
      <Container size="wide">
        <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-soft">
              What we can build
            </p>
            <h2 className="font-display mt-5 text-4xl leading-[1.05] tracking-tight sm:text-5xl">
              If it runs the business, we can probably build it.
            </h2>
          </Reveal>
          <Reveal delay={0.08} className="lg:pt-8">
            <p className="text-lg leading-relaxed text-slate-soft">
              The command center is the wrapper. Inside it, we can build the
              modules your business actually needs first, then expand as the
              work proves itself.
            </p>
          </Reveal>
        </div>

        <RevealGroup
          className="mt-14 grid gap-px border border-ivory/15 bg-ivory/15 sm:grid-cols-2 lg:grid-cols-4"
          stagger={0.04}
        >
          {capabilities.map((capability) => (
            <RevealItem key={capability}>
              <div className="bg-navy px-5 py-5 text-sm text-slate-soft transition-colors hover:bg-navy-700 hover:text-ivory">
                {capability}
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}
