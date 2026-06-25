import Container from "../Container";
import Reveal, { RevealGroup, RevealItem } from "../Reveal";
import { problems } from "./content";

export default function ProblemCards() {
  return (
    <section className="bg-ivory py-24 sm:py-28 lg:py-32">
      <Container size="wide">
        <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.22em] text-slate">
              The problem
            </p>
            <h2 className="font-display mt-5 max-w-2xl text-4xl leading-[1.05] tracking-tight sm:text-5xl">
              Small businesses are running on blind spots.
            </h2>
          </Reveal>

          <Reveal delay={0.08} className="lg:pt-8">
            <p className="text-lg leading-relaxed text-navy/75">
              Most owners do not need another disconnected tool. They need one
              system that shows what is happening, where money is leaking, who
              needs a follow-up, and what risk needs attention.
            </p>
          </Reveal>
        </div>

        <RevealGroup
          className="mt-14 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-5"
          stagger={0.07}
        >
          {problems.map((problem, index) => (
            <RevealItem key={problem.title}>
              <article className="bg-cream/50 rounded-xl border border-slate-line/70 p-6 lg:p-7 transition-all duration-300 hover:bg-ivory hover:-translate-y-1 hover:border-slate/40 hover:shadow-lg relative overflow-hidden">
                <span className="absolute top-4 right-4 font-display text-4xl text-slate-line select-none" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-2xl leading-tight tracking-tight">
                  {problem.title}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-navy/75">
                  {problem.body}
                </p>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}
