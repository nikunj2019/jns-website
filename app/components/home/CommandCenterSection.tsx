import Container from "../Container";
import Reveal from "../Reveal";
import CommandCenter from "./CommandCenter";

export default function CommandCenterSection() {
  return (
    <section id="command-center" className="bg-cream py-24 sm:py-28 lg:py-36">
      <Container size="wide">
        <div className="grid gap-10 xl:grid-cols-[0.62fr_1.38fr] xl:gap-14">
          <div>
            <Reveal>
              <p className="text-xs uppercase tracking-[0.22em] text-slate">
                The platform
              </p>
              <h2 className="font-display mt-5 text-4xl leading-[1.05] tracking-tight sm:text-5xl">
                A command center built around your business.
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="mt-7 text-lg leading-relaxed text-navy/75">
                We do not sell a template dashboard. We design the system around
                your pipeline, operations, marketing, customer experience, and
                security posture.
              </p>
            </Reveal>
            <Reveal delay={0.16}>
              <div className="mt-8 border-l-2 border-navy pl-5">
                <p className="text-sm leading-relaxed text-navy/78">
                  KPI cards are only useful when they lead to action. The goal
                  is not more charts. The goal is better decisions, faster
                  follow-up, cleaner operations, and less risk.
                </p>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.12} direction="up" distance={34}>
            <CommandCenter />
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
