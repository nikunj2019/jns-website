import Image from "next/image";
import Link from "next/link";
import Container from "../Container";
import Reveal from "../Reveal";

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
      <Container size="wide" className="relative py-24 sm:py-28 lg:py-32">
        <div className="grid items-end gap-10 lg:grid-cols-[1fr_0.42fr]">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-soft">
              Start here
            </p>
            <h2 className="font-display mt-5 max-w-4xl text-4xl leading-[1.04] tracking-tight sm:text-5xl lg:text-6xl">
              Bring us the messy part of your business. We&apos;ll tell you what
              to fix first.
            </h2>
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-slate-soft">
              If the right answer is a dashboard, CRM, workflow automation, ad
              system, security review, or nothing yet, we&apos;ll say that plainly.
            </p>
          </Reveal>
          <Reveal delay={0.12} className="lg:justify-self-end">
            <Link
              href="/contact"
              className="inline-flex border border-ivory bg-ivory px-8 py-5 text-base font-medium text-navy transition-colors hover:bg-transparent hover:text-ivory"
            >
              Start the conversation
            </Link>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
