"use client";

import { useCallback, useEffect, useState } from "react";
import { fsAddDoc, fsDeleteDoc, fsListDocs, fsSetDoc } from "../../../lib/firestoreRest";
import { normalizeEmail, TEAMS_COLLECTION, toTeam, type Player, type Team } from "../../lib/scoring";
import { idToken, useAuth } from "../../lib/useAuth";
import { Button, Card, Field, inputClass, SaveNote, saveErrorMessage } from "../ui";

const BLANK_PLAYERS: Player[] = [
  { name: "", email: "" },
  { name: "", email: "" },
  { name: "", email: "" },
  { name: "", email: "" },
];

type Draft = {
  id: string | null;
  name: string;
  captain: string;
  startingHole: string;
  players: Player[];
};

const emptyDraft = (): Draft => ({
  id: null,
  name: "",
  captain: "",
  startingHole: "",
  players: BLANK_PLAYERS.map((p) => ({ ...p })),
});

export default function TeamsAdmin() {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [save, setSave] = useState("idle");
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const docs = await fsListDocs(TEAMS_COLLECTION, "");
      setTeams(docs.map(toTeam).sort((a, b) => (a.startingHole ?? 99) - (b.startingHole ?? 99)));
    } catch {
      /* Offline, or nothing created yet. */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicks off the initial fetch; state lands in the promise callback
    void reload();
  }, [reload]);

  function editTeam(team: Team) {
    const players = [...team.players];
    while (players.length < 4) players.push({ name: "", email: "" });
    setDraft({
      id: team.id,
      name: team.name,
      captain: team.captain ?? "",
      startingHole: team.startingHole ? String(team.startingHole) : "",
      players,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveDraft() {
    if (!draft.name.trim()) {
      setError("Give the team a name.");
      setSave("error");
      return;
    }

    setSave("saving");
    setError("");

    const players = draft.players
      .filter((p) => p.name.trim())
      .map((p) => ({ name: p.name.trim(), email: p.email?.trim() ?? "" }));

    // playerEmails is what firestore.rules checks on every score write, so it
    // is derived here rather than trusted from anywhere else.
    const playerEmails = players
      .filter((p) => p.email)
      .map((p) => normalizeEmail(p.email!));

    const payload = {
      name: draft.name.trim(),
      captain: draft.captain.trim(),
      startingHole: Number(draft.startingHole) || 0,
      players,
      playerEmails,
    };

    try {
      const token = await idToken(user);
      if (draft.id) await fsSetDoc(TEAMS_COLLECTION, draft.id, payload, token!);
      else await fsAddDoc(TEAMS_COLLECTION, payload, token);
      setDraft(emptyDraft());
      setSave("saved");
      setTimeout(() => setSave("idle"), 2000);
      await reload();
    } catch (err) {
      setError(saveErrorMessage(err));
      setSave("error");
    }
  }

  async function removeTeam(team: Team) {
    if (!window.confirm(`Delete "${team.name}"? Their scores stay but will be orphaned.`)) return;
    try {
      const token = await idToken(user);
      await fsDeleteDoc(TEAMS_COLLECTION, team.id, token!);
      await reload();
    } catch (err) {
      setError(saveErrorMessage(err));
      setSave("error");
    }
  }

  function setPlayer(index: number, patch: Partial<Player>) {
    setDraft((d) => ({
      ...d,
      players: d.players.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    }));
  }

  return (
    <div className="space-y-4">
      <Card
        title={draft.id ? "Edit team" : "Add a team"}
        description="A player can only enter scores for a team their email is listed on. Leave an email blank if they won't be scoring."
      >
        <div className="space-y-3">
          <Field label="Team name">
            <input
              type="text"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Fairway Legends"
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Captain">
              <input
                type="text"
                value={draft.captain}
                onChange={(e) => setDraft({ ...draft, captain: e.target.value })}
                className={inputClass}
              />
            </Field>
            <Field label="Starting hole" hint="Shotgun start">
              <input
                type="number"
                min={1}
                max={18}
                value={draft.startingHole}
                onChange={(e) => setDraft({ ...draft, startingHole: e.target.value })}
                className={inputClass}
              />
            </Field>
          </div>

          <div>
            <p className="text-[0.62rem] uppercase tracking-[0.14em] text-cream-golf/45">
              Players
            </p>
            <div className="mt-2 space-y-2">
              {draft.players.map((player, i) => (
                <div key={i} className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) => setPlayer(i, { name: e.target.value })}
                    placeholder={`Player ${i + 1}`}
                    className={inputClass}
                  />
                  <input
                    type="email"
                    inputMode="email"
                    value={player.email ?? ""}
                    onChange={(e) => setPlayer(i, { email: e.target.value })}
                    placeholder="email (optional)"
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button onClick={saveDraft}>{draft.id ? "Save changes" : "Add team"}</Button>
          {draft.id && (
            <Button variant="ghost" onClick={() => setDraft(emptyDraft())}>
              Cancel
            </Button>
          )}
          <SaveNote state={save} error={error} />
        </div>
      </Card>

      <Card title={`Teams (${teams.length})`}>
        {loading ? (
          <p className="text-sm text-cream-golf/50">Loading…</p>
        ) : teams.length === 0 ? (
          <p className="text-sm text-cream-golf/50">None yet.</p>
        ) : (
          <ul className="space-y-2">
            {teams.map((team) => (
              <li
                key={team.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-cream-golf/12 px-3.5 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-[0.9rem] text-cream-golf">{team.name}</p>
                  <p className="truncate text-[0.72rem] text-cream-golf/45">
                    {team.players.map((p) => p.name).join(", ") || "No players"}
                  </p>
                  <p className="mt-0.5 text-[0.68rem] text-cream-golf/35">
                    {team.playerEmails.length} can score
                    {team.startingHole ? ` · starts on ${team.startingHole}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button variant="ghost" onClick={() => editTeam(team)}>
                    Edit
                  </Button>
                  <Button variant="danger" onClick={() => removeTeam(team)}>
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
