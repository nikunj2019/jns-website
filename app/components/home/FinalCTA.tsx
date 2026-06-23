import Image from "next/image";
import Container from "../Container";
import Reveal from "../Reveal";
import Button from "../Button";

const SIGNALS = [
  "30-minute discovery call — free",
  "Written proposal within 3 days",
  "Fixed fee, no surprises",
  "Founders on every engagement",
];

export default function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-navy text-ivory">
      <div
        aria-hidden="true"
        className="absolute -bottom-36 -right-24 h-[560px] w-[560px] opacity-[0.055]"
      >
        <Image
          src="/jns-logo.png"
          alt=""
          fill
          sizes="560px"
          className="object-contain invert"
        />
      </div>

      <Container size="wide" className="relative py-28 sm:py-36 lg:py-44">
        <Reveal>
          <p className="brand-eyebrow text-slate-soft flex items-center gap-3">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-ivory" aria-hidden="true" />
            Start here
          </p>
          <h2 className="font-display mt-6 max-w-4xl text-[2.8rem] leading-[1.02] tracking-tight sm:text-[3.8rem] lg:text-[5rem]">
            Bring us the messy part of your business. We&apos;ll tell you what to fix first.
          </h2>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-slate-soft">
            If the right answer is a dashboard, CRM, workflow automation, ad
            system, security review, or nothing yet — we&apos;ll say that plainly.
          </p>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button
              href="/contact"
              size="lg"
              variant="secondary"
              className="border-ivory bg-ivory px-10 py-5 text-base text-navy hover:bg-transparent hover:text-ivory"
            >
              Start the conversation
            </Button>
            <Button
              href="/services"
              size="lg"
              variant="secondary"
              className="border-ivory/35 text-ivory px-10 py-5 text-base hover:border-ivory hover:bg-ivory hover:text-navy"
            >
              See what we build
            </Button>
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <ul className="mt-12 flex flex-wrap gap-x-8 gap-y-3">
            {SIGNALS.map((s) => (
              <li key={s} className="flex items-center gap-2.5 text-sm text-slate-soft">
                <span className="w-1 h-1 rounded-full bg-slate-soft shrink-0" aria-hidden="true" />
                {s}
              </li>
            ))}
          </ul>
        </Reveal>
      </Container>
    </section>
  );
}
