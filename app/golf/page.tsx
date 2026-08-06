import Link from "next/link";
import Crest from "./components/Crest";
import JNSBar from "./components/JNSBar";
import TileGrid, { type Tile } from "./components/TileGrid";
import InstallButton from "./components/InstallButton";
import EventStatusCard from "./components/EventStatusCard";
import {
  CalendarIcon,
  ClockIcon,
  DollarIcon,
  FlagIcon,
  HeartIcon,
  InfoIcon,
  MailIcon,
  MapIcon,
  PhoneIcon,
  PinIcon,
  TeamIcon,
  TrophyIcon,
} from "./components/icons";
import { EVENT, formatEventDate, telHref } from "./lib/event";

const TILES: Tile[] = [
  { href: "/golf/leaderboard/", label: "Leaderboard", icon: <TrophyIcon /> },
  { href: "/golf/score/", label: "Enter Scores", icon: <FlagIcon /> },
  { href: "/golf/course/", label: "Course Map", icon: <MapIcon /> },
  { href: "/golf/teams/", label: "Teams", icon: <TeamIcon /> },
  { href: "/golf/info/", label: "Event Info", icon: <InfoIcon /> },
  { href: "/golf/sponsors/", label: "Sponsors", icon: <HeartIcon /> },
];

function DetailRow({
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
      <div className="min-w-0">
        <p className="text-[0.62rem] uppercase tracking-[0.16em] text-cream-golf/45">{label}</p>
        <div className="mt-0.5 text-[0.95rem] leading-snug text-cream-golf">{children}</div>
      </div>
    </div>
  );
}

export default function GolfHomePage() {
  const { venue, payment, rsvp } = EVENT;

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="golf-stripes relative overflow-hidden border-b border-brass/20 bg-gradient-to-b from-fairway-800 to-fairway-900 px-6 pb-10 pt-12 text-center">
        <div className="mx-auto max-w-2xl">
          <div className="flex justify-center">
            <Crest size={92} />
          </div>

          <h1 className="font-display mt-6 text-[2.1rem] leading-[1.1] tracking-tight text-cream-golf sm:text-[2.6rem]">
            Annual Stonegate
            <br />
            Men&rsquo;s Golf Scramble
          </h1>

          <div className="mx-auto mt-5 h-px w-16 bg-brass/50" />

          <p className="golf-eyebrow mt-5">{EVENT.tagline}</p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-2xl flex-1 px-5 pb-12 pt-6">
        <EventStatusCard />

        {/* ── At a glance ──────────────────────────────────────────────────── */}
        <section className="mt-5 rounded-2xl border border-cream-golf/12 bg-fairway-800 px-5 py-3">
          <h2 className="sr-only">Event details</h2>
          <div className="divide-y divide-cream-golf/8">
            <DetailRow icon={<CalendarIcon size={20} />} label="Date">
              {formatEventDate(EVENT.date)}
            </DetailRow>
            <DetailRow icon={<ClockIcon size={20} />} label="Tee Off">
              {EVENT.teeTime}
              <span className="mt-0.5 block text-[0.8rem] text-cream-golf/55">{EVENT.format}</span>
            </DetailRow>
            <DetailRow icon={<PinIcon size={20} />} label="Location">
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(
                  `${venue.name}, ${venue.address}, ${venue.city}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-brass/40 underline-offset-4 transition-colors hover:text-brass-soft"
              >
                {venue.name}
              </a>
              <span className="mt-0.5 block text-[0.8rem] text-cream-golf/55">
                {venue.address}, {venue.city}
              </span>
            </DetailRow>
            <DetailRow icon={<DollarIcon size={20} />} label="Cost">
              <span className="golf-nums">${EVENT.costPerPlayer}</span> per player
              <span className="mt-0.5 block text-[0.8rem] text-cream-golf/55">{payment.note}</span>
            </DetailRow>
          </div>
        </section>

        {/* ── Navigation ───────────────────────────────────────────────────── */}
        <section className="mt-6">
          <h2 className="golf-eyebrow mb-3">The Outing</h2>
          <TileGrid tiles={TILES} />
        </section>

        {/* ── RSVP ─────────────────────────────────────────────────────────── */}
        <section className="mt-8 rounded-2xl border border-brass/30 bg-brass/8 p-5">
          <h2 className="font-display text-xl text-cream-golf">Let Curtis know you&rsquo;re in</h2>
          <p className="mt-2 text-[0.88rem] leading-relaxed text-cream-golf/75">
            Got a foursome? Share the names. Solo or partial is fine too — he&rsquo;ll fill out
            your group.
          </p>
          <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
            <a
              href={`mailto:${rsvp.email}?subject=${encodeURIComponent(
                "Stonegate Golf Scramble — I'm in"
              )}`}
              className="flex items-center justify-center gap-2 rounded-xl bg-cream-golf px-4 py-3.5 text-sm font-medium text-fairway-900 transition-opacity hover:opacity-90 active:scale-[0.99]"
            >
              <MailIcon size={17} />
              Email Curtis
            </a>
            <a
              href={telHref(rsvp.phone)}
              className="flex items-center justify-center gap-2 rounded-xl border border-cream-golf/25 px-4 py-3.5 text-sm font-medium text-cream-golf transition-colors hover:bg-cream-golf/10 active:scale-[0.99]"
            >
              <PhoneIcon size={17} />
              Call or Text
            </a>
          </div>
          <p className="mt-3 text-center text-[0.72rem] text-cream-golf/45">
            {rsvp.contact} · {rsvp.email} · {rsvp.phone}
          </p>
        </section>

        {/* ── Payment ──────────────────────────────────────────────────────── */}
        <section className="mt-6 rounded-2xl border border-cream-golf/12 bg-fairway-800 p-5">
          <h2 className="golf-eyebrow">Payment Options</h2>
          <hr className="golf-rule my-3" />
          <dl className="space-y-3.5 text-[0.9rem]">
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
              <dd className="mt-1 text-cream-golf/70">
                Payable to <span className="text-cream-golf">{payment.checkPayableTo}</span>
                <span className="mt-0.5 block">Drop at {payment.dropOff}</span>
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-[0.78rem] text-cream-golf/50">
            <span className="golf-nums">${EVENT.costPerPlayer}</span> per player. {payment.note}
          </p>
        </section>

        {/* ── Install ──────────────────────────────────────────────────────── */}
        <section className="mt-6">
          <InstallButton />
        </section>

        <p className="mt-6 text-center text-[0.75rem] text-cream-golf/40">
          <Link href="/golf/info/" className="underline underline-offset-4 hover:text-cream-golf/70">
            Full event details
          </Link>
        </p>
      </main>

      <JNSBar />
    </>
  );
}
