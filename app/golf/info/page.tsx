import type { Metadata } from "next";
import GolfHeader from "../components/GolfHeader";
import JNSBar from "../components/JNSBar";
import {
  CalendarIcon,
  CheckIcon,
  ClockIcon,
  DollarIcon,
  FlagIcon,
  MailIcon,
  PhoneIcon,
  PinIcon,
} from "../components/icons";
import { EVENT, formatEventDate, telHref } from "../lib/event";

export const metadata: Metadata = {
  title: "Event Info",
  description: "Everything you need for the Annual Stonegate Men's Golf Scramble.",
};

const TODO_LIST = [
  "Mark your calendar",
  "Let Curtis know you're in",
  "Share your foursome's names — or come solo and he'll fill you in",
  "Send payment before the event",
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-2xl border border-cream-golf/12 bg-fairway-800 p-5">
      <h2 className="golf-eyebrow">{title}</h2>
      <hr className="golf-rule my-3" />
      {children}
    </section>
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="mt-0.5 shrink-0 text-brass" aria-hidden="true">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[0.62rem] uppercase tracking-[0.16em] text-cream-golf/45">{label}</p>
        <div className="mt-0.5 text-[0.95rem] leading-snug text-cream-golf">{children}</div>
      </div>
    </div>
  );
}

export default function InfoPage() {
  const { venue, payment, rsvp } = EVENT;
  const mapsQuery = encodeURIComponent(`${venue.name}, ${venue.address}, ${venue.city}`);

  return (
    <>
      <GolfHeader title="Event Info" />

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 pb-12 pt-5">
        <Section title="The Outing">
          <div className="divide-y divide-cream-golf/8">
            <Row icon={<CalendarIcon size={20} />} label="Date">
              {formatEventDate(EVENT.date)}
            </Row>
            <Row icon={<ClockIcon size={20} />} label="Tee Off">
              {EVENT.teeTime}
            </Row>
            <Row icon={<FlagIcon size={20} />} label="Format">
              {EVENT.format}
              <span className="mt-1 block text-[0.82rem] leading-relaxed text-cream-golf/60">
                Every player tees off, the group picks the best shot, and everyone plays their
                next from there. One score per team on each hole.
              </span>
            </Row>
            <Row icon={<DollarIcon size={20} />} label="Cost">
              <span className="golf-nums">${EVENT.costPerPlayer}</span> per player
              <span className="mt-0.5 block text-[0.82rem] text-cream-golf/60">{payment.note}</span>
            </Row>
          </div>
        </Section>

        <Section title="The Course">
          <div className="divide-y divide-cream-golf/8">
            <Row icon={<PinIcon size={20} />} label="Where">
              {venue.name}
              <span className="mt-0.5 block text-[0.82rem] text-cream-golf/60">
                {venue.address}
                <br />
                {venue.city}
              </span>
            </Row>
            <Row icon={<PhoneIcon size={20} />} label="Pro Shop">
              <a href={telHref(venue.phone)} className="underline decoration-brass/40 underline-offset-4">
                {venue.phone}
              </a>
            </Row>
          </div>
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            <a
              href={`https://maps.google.com/?q=${mapsQuery}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl bg-cream-golf px-4 py-3 text-sm font-medium text-fairway-900 transition-opacity hover:opacity-90"
            >
              <PinIcon size={17} />
              Directions
            </a>
            <a
              href={venue.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl border border-cream-golf/25 px-4 py-3 text-sm font-medium text-cream-golf transition-colors hover:bg-cream-golf/10"
            >
              Course Website
            </a>
          </div>
        </Section>

        <Section title="To-Do List">
          <ul className="space-y-2.5">
            {TODO_LIST.map((item) => (
              <li key={item} className="flex items-start gap-3 text-[0.92rem] text-cream-golf/85">
                <span className="mt-0.5 shrink-0 text-brass" aria-hidden="true">
                  <CheckIcon size={17} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Payment">
          <dl className="space-y-3.5 text-[0.92rem]">
            <div>
              <dt className="flex items-center gap-2 text-cream-golf">
                Venmo
                <span className="rounded-full bg-brass/20 px-2 py-0.5 text-[0.6rem] uppercase tracking-wider text-brass-soft">
                  Preferred
                </span>
              </dt>
              <dd className="mt-1">
                <a
                  href={`https://venmo.com/${payment.venmo.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-brass-soft underline decoration-brass/40 underline-offset-4"
                >
                  {payment.venmo}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-cream-golf">Check</dt>
              <dd className="mt-1 leading-relaxed text-cream-golf/70">
                Payable to <span className="text-cream-golf">{payment.checkPayableTo}</span>.
                <br />
                Drop off at {payment.dropOff}.
              </dd>
            </div>
          </dl>
        </Section>

        <Section title="RSVP">
          <p className="text-[0.92rem] leading-relaxed text-cream-golf/75">
            {rsvp.contact} is organising. Email or text him with your foursome — or on your own,
            and he&rsquo;ll put a group together.
          </p>
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            <a
              href={`mailto:${rsvp.email}?subject=${encodeURIComponent(
                "Stonegate Golf Scramble — I'm in"
              )}`}
              className="flex items-center justify-center gap-2 rounded-xl bg-cream-golf px-4 py-3 text-sm font-medium text-fairway-900 transition-opacity hover:opacity-90"
            >
              <MailIcon size={17} />
              {rsvp.email}
            </a>
            <a
              href={telHref(rsvp.phone)}
              className="flex items-center justify-center gap-2 rounded-xl border border-cream-golf/25 px-4 py-3 text-sm font-medium text-cream-golf transition-colors hover:bg-cream-golf/10"
            >
              <PhoneIcon size={17} />
              {rsvp.phone}
            </a>
          </div>
        </Section>

        <Section title="What to Bring">
          <ul className="space-y-2 text-[0.92rem] leading-relaxed text-cream-golf/80">
            <li>Clubs, and enough balls for a scramble pace.</li>
            <li>Sunscreen, a hat, and water — late August in Indiana.</li>
            <li>Soft spikes. Denim is generally a no at the Trophy Club.</li>
            <li>Your phone, with this app added to your home screen for scoring.</li>
          </ul>
        </Section>
      </main>

      <JNSBar />
    </>
  );
}
