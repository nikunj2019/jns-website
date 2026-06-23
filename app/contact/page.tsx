import type { Metadata } from "next";
import Container from "../components/Container";
import SectionLabel from "../components/SectionLabel";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Tell us what's slow, broken, or unbuilt. We reply within one business day.",
};

export default function ContactPage() {
  return (
    <>
      <section className="border-b border-slate-line">
        <Container size="wide" className="pt-20 pb-20 sm:pt-28 sm:pb-28">
          <SectionLabel>Contact</SectionLabel>
          <h1 className="font-display mt-8 text-[2.5rem] leading-[1.05] tracking-tight sm:text-[3.5rem] lg:text-[4.5rem] max-w-4xl">
            Tell us what&apos;s slow, broken, or unbuilt.
          </h1>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-navy/75 sm:text-xl">
            We reply within one business day with a straight answer on whether
            we&apos;re the right people for it.
          </p>
        </Container>
      </section>

      <section className="py-24 sm:py-32">
        <Container size="wide">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
            {/* Form */}
            <div className="lg:col-span-7">
              <ContactForm />
            </div>

            {/* Side info */}
            <aside className="lg:col-span-5 space-y-12">
              <div>
                <SectionLabel>Email</SectionLabel>
                <a
                  href="mailto:hello@jnsconsulting.ai"
                  className="font-display mt-5 block text-2xl lg:text-3xl text-navy hover:text-navy-700 transition-colors break-words"
                >
                  hello@jnsconsulting.ai
                </a>
              </div>

              <div>
                <SectionLabel>What happens next</SectionLabel>
                <ol className="mt-6 space-y-5">
                  {[
                    "We read your note (a person, not a bot).",
                    "We reply within one business day with a yes, a no, or a few clarifying questions.",
                    "If it's a fit, we book a 30-minute discovery call. Free, no pitch deck.",
                    "If it isn't, we tell you who is. Often it's a referral.",
                  ].map((step) => (
                    <li key={step} className="flex gap-4">
                      <span className="mt-3 h-px w-5 shrink-0 bg-slate" />
                      <span className="text-[0.9375rem] leading-relaxed text-navy/80">
                        {step}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <SectionLabel>Response time</SectionLabel>
                <p className="mt-5 text-[0.9375rem] leading-relaxed text-navy/80">
                  Monday through Friday, US business hours. We don&apos;t reply
                  on weekends, because we want our team rested and yours respected.
                </p>
              </div>
            </aside>
          </div>
        </Container>
      </section>
    </>
  );
}
