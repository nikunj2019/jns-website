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
                One system. Every part of the business.
              </h2>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="mt-7 text-lg leading-relaxed text-navy/75">
                We build the command center your business actually needs — AI voice agents,
                owner dashboards, booking systems, automations, and analytics,
                all wired together and built around how you operate.
              </p>
            </Reveal>
            <Reveal delay={0.16}>
              <div className="mt-8 border-l-2 border-navy pl-5">
                <p className="text-sm leading-relaxed text-navy/78">
                  Every tab above is something we have shipped for a real client.
                  Not a demo. Not a template. Software that runs their business today.
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
