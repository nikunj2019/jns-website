import type { Metadata } from "next";
import Container from "../components/Container";
import Button from "../components/Button";
import SectionLabel from "../components/SectionLabel";
import Reveal, { RevealGroup, RevealItem } from "../components/Reveal";

export const metadata: Metadata = {
  title: "About",
  description:
    "JNS Consulting was founded by Nikunj Jadawala, Jiten Patel, and Shayar Patel — an application security engineer, a financial auditor, and a hospitality operator.",
};

const FOUNDERS = [
  {
    initial: "N",
    name: "Nikunj Jadawala",
    role: "Delivery Lead",
    background: "Application Development · Security",
    bio: "Nikunj writes the code, runs the security work, and owns whether what we shipped actually works. Background in production web applications and application security across multiple stacks.",
  },
  {
    initial: "J",
    name: "Jiten Patel",
    role: "Sales & Client Relationships",
    background: "Financial Audit",
    bio: "Jiten brings audit discipline to scoping, pricing, and ROI. If a project doesn't have a number attached, he asks why. Clients work with him through the proposal, the kickoff, and every quarterly review.",
  },
  {
    initial: "S",
    name: "Shayar Patel",
    role: "Sales & Client Relationships",
    background: "Hospitality · IT",
    bio: "Shayar has been the small business operator on the other side of the table — running a hotel, managing the IT that holds it together. He translates business pain into technical scope and keeps engagements grounded in operational reality.",
  },
];

const PRINCIPLES = [
  { t: "Considered.", b: "Direct. Says what it means in fewer words." },
  { t: "Confident.", b: "Doesn't hedge." },
  { t: "Warm.", b: "Speaks to people, not titles." },
  { t: "Specific.", b: "Names the actual thing." },
  { t: "Calm.", b: "Trusts the reader." },
];

export default function AboutPage() {
  return (
    <>
      {/* HEADER */}
      <section className="border-b border-slate-line">
        <Container size="wide" className="pt-20 pb-24 sm:pt-28 sm:pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
            <Reveal className="lg:col-span-7">
              <SectionLabel>About JNS</SectionLabel>
              <h1 className="font-display mt-8 text-[2.5rem] leading-[1.05] tracking-tight sm:text-[3.5rem] lg:text-[4.5rem]">
                Three operators, building the firm we always wanted to hire.
              </h1>
            </Reveal>
            <Reveal delay={0.15} className="lg:col-span-5 lg:pl-8">
              <p className="text-lg leading-relaxed text-navy/75">
                JNS Consulting was founded in 2026 by Nikunj Jadawala, Jiten
                Patel, and Shayar Patel — an application security engineer, a
                financial auditor, and a hospitality operator. We
                kept watching small businesses get sold the wrong things by the
                wrong people. We started JNS to be the right people.
              </p>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* FOUNDERS */}
      <section className="py-28 sm:py-36">
        <Container size="wide">
          <Reveal>
            <SectionLabel>Founding Partners</SectionLabel>
            <h2 className="font-display mt-6 text-4xl sm:text-5xl leading-[1.05] tracking-tight">
              The three letters in the logo.
            </h2>
          </Reveal>

          <RevealGroup
            className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-px bg-slate-line border border-slate-line"
            stagger={0.12}
          >
            {FOUNDERS.map((f) => (
              <RevealItem key={f.name}>
                <article className="bg-ivory p-8 lg:p-10 flex flex-col h-full">
                {/* Initial-as-avatar — clean, brand-appropriate, no fake stock photos */}
                <div className="aspect-square bg-cream relative overflow-hidden border border-slate-line/60">
                  <span className="absolute inset-0 flex items-center justify-center font-display text-[10rem] leading-none text-navy">
                    {f.initial}
                  </span>
                  <span className="absolute top-4 left-4 brand-eyebrow text-slate">
                    {f.name.split(" ")[1]}
                  </span>
                  <span className="absolute bottom-4 right-4 inline-block w-2 h-2 rounded-full bg-navy" />
                </div>

                <h3 className="font-display mt-8 text-2xl leading-tight tracking-tight">
                  {f.name}
                </h3>
                <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate">
                  {f.role}
                  <span className="mx-2 text-slate-line">·</span>
                  {f.background}
                </p>
                <p className="mt-5 text-[0.9375rem] leading-relaxed text-navy/80 flex-1">
                  {f.bio}
                </p>
                </article>
              </RevealItem>
            ))}
          </RevealGroup>

        </Container>
      </section>

      {/* STORY */}
      <section className="bg-cream py-28 sm:py-36">
        <Container size="narrow">
          <Reveal>
            <SectionLabel>The story</SectionLabel>
            <h2 className="font-display mt-6 text-4xl sm:text-5xl leading-[1.08] tracking-tight">
              We started JNS because nobody else was doing this honestly.
            </h2>
          </Reveal>

          <RevealGroup className="mt-12 space-y-7 text-lg leading-relaxed text-navy/85" stagger={0.1}>
            <RevealItem>
              <p>
                Small businesses get sold software they don&apos;t need, ad campaigns
                that report on the wrong metrics, and security reviews that
                produce 80-page PDFs no one reads. The agencies that handle each
                one don&apos;t talk to each other, and the bill at the end is more
                than the result.
              </p>
            </RevealItem>
            <RevealItem>
              <p>
                Between us, we&apos;ve sat on every side of that table. Nikunj wrote
                the code and patched the breaches. Jiten audited the books. Shayar
                ran the business that was paying for all of it. We started JNS
                because we knew a smaller, more honest version of this work was
                possible — and we were tired of waiting for someone else to build
                the firm.
              </p>
            </RevealItem>
            <RevealItem>
              <p>
                We named the firm after ourselves on purpose. The work has our
                names on it. So does the accountability.
              </p>
            </RevealItem>
          </RevealGroup>
        </Container>
      </section>

      {/* PRINCIPLES — voice & tone, drawn directly from the brand guide */}
      <section className="py-28 sm:py-36">
        <Container size="wide">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
            <Reveal className="lg:col-span-5">
              <SectionLabel>The voice</SectionLabel>
              <h2 className="font-display mt-6 text-4xl sm:text-5xl leading-[1.05] tracking-tight">
                How we talk is how we work.
              </h2>
            </Reveal>
            <Reveal delay={0.1} className="lg:col-span-6 lg:col-start-7 flex items-end">
              <p className="text-lg leading-relaxed text-navy/75">
                The brand guide is short and the voice is enforced. Same
                discipline goes into the software, the campaigns, and the
                reports.
              </p>
            </Reveal>
          </div>

          <RevealGroup
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-x-8 gap-y-12 border-t border-slate-line pt-12"
            stagger={0.08}
          >
            {PRINCIPLES.map((p) => (
              <RevealItem key={p.t}>
                <div>
                  <p className="font-display text-2xl leading-tight tracking-tight">
                    {p.t}
                  </p>
                  <p className="mt-3 text-[0.9375rem] leading-relaxed text-navy/75">
                    {p.b}
                  </p>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </Container>
      </section>

      {/* CTA */}
      <section className="bg-navy text-ivory">
        <Container size="wide" className="py-24 sm:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <Reveal className="lg:col-span-8">
              <h2 className="font-display text-4xl sm:text-5xl leading-[1.05] tracking-tight">
                Hire the firm. Talk to the founders.
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-soft">
                We don&apos;t hand you off to a junior. The names on the door are
                the names you&apos;ll be working with.
              </p>
            </Reveal>
            <Reveal delay={0.15} className="lg:col-span-4 flex lg:justify-end">
              <Button href="/contact" size="lg" variant="secondary" className="bg-ivory text-navy border-ivory hover:bg-transparent hover:text-ivory">
                Start the conversation
              </Button>
            </Reveal>
          </div>
        </Container>
      </section>
    </>
  );
}
