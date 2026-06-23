import Link from "next/link";
import Container from "./Container";
import Logo from "./Logo";

const COLS = [
  {
    heading: "Services",
    links: [
      { label: "AI Voice Agents", href: "/services#ai-voice" },
      { label: "Custom Software", href: "/services#custom-builds" },
      { label: "Workflow Automation", href: "/services#automation" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    heading: "Connect",
    links: [
      { label: "Email us", href: "mailto:hello@jnsconsulting.ai" },
    ],
  },
];

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-32 bg-cream text-navy">
      <Container size="wide" className="py-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <Logo size={84} showWordmark={false} />
            <p className="mt-6 max-w-sm text-[0.9375rem] leading-relaxed text-navy/75">
              Smart Solutions, Built for You. We build AI voice agents, custom
              dashboards, booking and CRM systems, automations, and security for
              small businesses, all in one place.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:col-span-7">
            {COLS.map((col) => (
              <div key={col.heading}>
                <p className="brand-eyebrow text-slate">{col.heading}</p>
                <ul className="mt-5 space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-navy/80 hover:text-navy transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <hr className="brand-rule my-12 border-slate-line/70" />

        <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs tracking-wide text-slate">
            © {year} JNS Consulting. All rights reserved.
          </p>
          <p className="text-xs tracking-[0.18em] uppercase text-slate">
            Smart Solutions, Built for You<span className="text-navy">.</span>
          </p>
        </div>
      </Container>
    </footer>
  );
}
