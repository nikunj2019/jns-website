"use client";

import { useEffect, useState } from "react";
import { fsPatchDoc } from "../../lib/firestoreRest";
import type { EventStatus } from "../lib/event";
import { idToken, useAuth } from "../lib/useAuth";
import { EVENT_COLLECTION, EVENT_DOC, useEvent } from "../lib/useEvent";
import { Button, Card, Field, inputClass, SaveNote, saveErrorMessage } from "./ui";

const STATUSES: { id: EventStatus; label: string; help: string }[] = [
  { id: "upcoming", label: "Upcoming", help: "Countdown on the home screen." },
  { id: "live", label: "Live", help: "Scores are being played right now." },
  { id: "final", label: "Final", help: "Round over; results stand." },
];

export default function EventAdmin() {
  const { user } = useAuth();
  const { event, loaded } = useEvent();

  const [status, setStatus] = useState<EventStatus>(event.status);
  const [scoringOpen, setScoringOpen] = useState(event.scoringOpen);
  const [date, setDate] = useState(event.date);
  const [teeTime, setTeeTime] = useState(event.teeTime);
  const [cost, setCost] = useState(String(event.costPerPlayer));
  const [save, setSave] = useState("idle");
  const [error, setError] = useState("");

  // Sync once the stored config arrives, without stomping in-progress edits.
  useEffect(() => {
    if (!loaded) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- seeding form fields from config fetched after mount
    setStatus(event.status);
    setScoringOpen(event.scoringOpen);
    setDate(event.date);
    setTeeTime(event.teeTime);
    setCost(String(event.costPerPlayer));
  }, [loaded]); // eslint-disable-line react-hooks/exhaustive-deps

  async function persist(patch: Record<string, unknown>) {
    setSave("saving");
    setError("");
    try {
      const token = await idToken(user);
      await fsPatchDoc(EVENT_COLLECTION, EVENT_DOC, patch, token);
      setSave("saved");
      setTimeout(() => setSave("idle"), 2000);
    } catch (err) {
      setError(saveErrorMessage(err));
      setSave("error");
    }
  }

  return (
    <div className="space-y-4">
      <Card
        title="Event status"
        description="Drives the home screen banner and whether players can enter scores."
      >
        <div className="space-y-2">
          {STATUSES.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                setStatus(option.id);
                void persist({ status: option.id });
              }}
              className={`flex w-full items-start gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors ${
                status === option.id
                  ? "border-brass bg-brass/10"
                  : "border-cream-golf/15 hover:bg-cream-golf/5"
              }`}
            >
              <span
                className={`mt-1 h-3 w-3 shrink-0 rounded-full border ${
                  status === option.id ? "border-brass bg-brass" : "border-cream-golf/35"
                }`}
                aria-hidden="true"
              />
              <span>
                <span className="block text-[0.88rem] text-cream-golf">{option.label}</span>
                <span className="block text-[0.72rem] text-cream-golf/45">{option.help}</span>
              </span>
            </button>
          ))}
        </div>

        <label className="mt-4 flex items-center justify-between rounded-lg border border-cream-golf/15 px-3.5 py-3">
          <span>
            <span className="block text-[0.88rem] text-cream-golf">Scoring open</span>
            <span className="block text-[0.72rem] text-cream-golf/45">
              Players can enter their team&rsquo;s scores.
            </span>
          </span>
          <input
            type="checkbox"
            checked={scoringOpen}
            onChange={(e) => {
              setScoringOpen(e.target.checked);
              void persist({ scoringOpen: e.target.checked });
            }}
            className="h-5 w-5 accent-[color:var(--color-brass)]"
          />
        </label>
      </Card>

      <Card title="Details" description="Overrides the values committed in the code.">
        <div className="space-y-3">
          <Field label="Date" hint="YYYY-MM-DD">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Tee time">
            <input
              type="text"
              value={teeTime}
              onChange={(e) => setTeeTime(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Cost per player" hint="Dollars, digits only.">
            <input
              type="number"
              inputMode="numeric"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Button
            onClick={() =>
              persist({
                date,
                teeTime,
                costPerPlayer: Number(cost) || event.costPerPlayer,
              })
            }
          >
            Save details
          </Button>
          <SaveNote state={save} error={error} />
        </div>
      </Card>

      <Card
        title="Setup checklist"
        description="One-time Firebase steps. Nothing here can be done from the app."
      >
        <ol className="space-y-2.5 text-[0.82rem] leading-relaxed text-cream-golf/70">
          <li>
            <span className="text-cream-golf">1.</span> Authentication → Sign-in method → enable{" "}
            <span className="text-cream-golf">Email/Password</span> and{" "}
            <span className="text-cream-golf">Email link (passwordless sign-in)</span>.
          </li>
          <li>
            <span className="text-cream-golf">2.</span> Authentication → Settings → Authorized
            domains → add <span className="text-cream-golf">jnsconsulting.ai</span>.
          </li>
          <li>
            <span className="text-cream-golf">3.</span> Add each organizer under Authentication →
            Users, and list their addresses in{" "}
            <span className="text-cream-golf">firestore.rules</span>.
          </li>
          <li>
            <span className="text-cream-golf">4.</span> Deploy the rules:{" "}
            <code className="rounded bg-fairway-900 px-1.5 py-0.5 text-[0.75rem]">
              firebase deploy --only firestore:rules
            </code>
          </li>
        </ol>
      </Card>
    </div>
  );
}
