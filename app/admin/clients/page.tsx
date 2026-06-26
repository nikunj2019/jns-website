"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  orderBy,
  query,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { auth, getDb } from "../../lib/firebase";
import { AdminNav } from "../AdminNav";
import { DEFAULT_QUESTIONS, STEP_LABELS, type SurveyQuestion, type QuestionType } from "../../lib/survey-questions";
import { generateQuestionsWithAI, AI_AVAILABLE } from "../../lib/generate-questions";

interface Invite {
  id: string;
  clientName: string;
  clientEmail: string;
  notes: string;
  createdAt: string;
  status: "pending" | "completed";
  submissionId?: string | null;
  customQuestions?: SurveyQuestion[];
}

const INPUT_CLASS =
  "w-full border border-slate-line bg-ivory px-4 py-3 text-sm text-navy placeholder-slate/60 focus:border-navy focus:outline-none transition-colors";

const SMALL_INPUT =
  "w-full border border-slate-line bg-white px-3 py-2 text-sm text-navy placeholder-slate/60 focus:border-navy focus:outline-none transition-colors";

const QUESTION_TYPES: QuestionType[] = ["text", "email", "tel", "radio", "checkbox", "textarea", "select"];

function QuestionRow({
  q,
  onEdit,
  onDelete,
}: {
  q: SurveyQuestion;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-start justify-between border border-slate-line bg-white px-3 py-2.5 rounded-lg">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-navy font-medium truncate">{q.label}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs bg-cream text-slate px-1.5 py-0.5 rounded-full">{q.type}</span>
          {q.required && <span className="text-xs text-slate">req</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 ml-2 flex-shrink-0">
        <button onClick={onEdit} className="text-xs text-slate hover:text-navy transition-colors">Edit</button>
        <button onClick={onDelete} className="text-xs text-slate hover:text-red-600 transition-colors">✕</button>
      </div>
    </div>
  );
}

function QuestionEditor({
  question,
  onSave,
  onCancel,
}: {
  question: SurveyQuestion;
  onSave: (q: SurveyQuestion) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<SurveyQuestion>({ ...question });
  const needsOptions = ["radio", "checkbox", "select"].includes(draft.type);

  return (
    <div className="bg-cream rounded-lg p-3 space-y-3 text-sm border border-slate-line">
      <div>
        <label className="block text-xs font-medium text-slate mb-1 uppercase tracking-wide">Label</label>
        <input
          value={draft.label}
          onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
          className={SMALL_INPUT}
          placeholder="Question label"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-slate mb-1 uppercase tracking-wide">Type</label>
          <select
            value={draft.type}
            onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as QuestionType }))}
            className={SMALL_INPUT}
          >
            {QUESTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate mb-1 uppercase tracking-wide">Step</label>
          <select
            value={draft.step}
            onChange={(e) => setDraft((d) => ({ ...d, step: Number(e.target.value) }))}
            className={SMALL_INPUT}
          >
            {STEP_LABELS.map((label, i) => (
              <option key={i + 1} value={i + 1}>{i + 1} — {label}</option>
            ))}
          </select>
        </div>
      </div>
      {needsOptions && (
        <div>
          <label className="block text-xs font-medium text-slate mb-1 uppercase tracking-wide">Options (comma-separated)</label>
          <textarea
            rows={2}
            value={(draft.options ?? []).join(", ")}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              }))
            }
            className={`${SMALL_INPUT} resize-y`}
            placeholder="Option A, Option B"
          />
        </div>
      )}
      {(draft.type === "text" || draft.type === "email" || draft.type === "tel" || draft.type === "textarea") && (
        <div>
          <label className="block text-xs font-medium text-slate mb-1 uppercase tracking-wide">Placeholder</label>
          <input
            value={draft.placeholder ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, placeholder: e.target.value }))}
            className={SMALL_INPUT}
            placeholder="Placeholder text"
          />
        </div>
      )}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={draft.required}
          onChange={(e) => setDraft((d) => ({ ...d, required: e.target.checked }))}
          className="w-4 h-4 border border-slate-line"
        />
        <span className="text-xs text-navy">Required</span>
      </label>
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onSave(draft)}
          className="bg-navy text-ivory text-xs px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity"
        >
          Save
        </button>
        <button onClick={onCancel} className="text-xs text-slate hover:text-navy transition-colors">Cancel</button>
      </div>
    </div>
  );
}

function AIGeneratorPanel({ onApply }: { onApply: (qs: SurveyQuestion[], mode: "replace" | "append") => void }) {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState<SurveyQuestion[] | null>(null);
  const [error, setError] = useState("");

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setGenerating(true);
    setError("");
    setPreview(null);
    try {
      const qs = await generateQuestionsWithAI(prompt);
      setPreview(qs);
    } catch (err) {
      setError((err as Error).message || "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  if (!AI_AVAILABLE) {
    return (
      <div className="text-xs text-slate bg-cream rounded-lg p-3 border border-slate-line">
        Add <code className="font-mono bg-white px-1 rounded">NEXT_PUBLIC_GEMINI_API_KEY</code> to GitHub secrets to enable AI generation (free at aistudio.google.com).
      </div>
    );
  }

  return (
    <div className="bg-navy/5 border border-navy/10 rounded-lg p-3 space-y-3">
      <p className="text-xs font-medium text-navy uppercase tracking-wide flex items-center gap-1.5">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1L7.5 4.5H11L8.25 6.75L9.25 10.5L6 8.25L2.75 10.5L3.75 6.75L1 4.5H4.5L6 1Z" fill="currentColor" /></svg>
        Generate with AI
      </p>
      <textarea
        rows={2}
        value={prompt}
        onChange={(e) => { setPrompt(e.target.value); setPreview(null); }}
        placeholder="Describe what you want, e.g. 'Beauty salon owner, focus on missed calls, booking pain points, and interest in AI receptionist'"
        className="w-full border border-slate-line bg-white px-3 py-2 text-sm text-navy placeholder-slate/60 focus:border-navy focus:outline-none transition-colors resize-none"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}

      {!preview ? (
        <button
          onClick={handleGenerate}
          disabled={generating || !prompt.trim()}
          className="inline-flex items-center gap-2 bg-navy text-ivory text-xs px-4 py-2 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {generating ? (
            <><span className="w-3 h-3 border border-ivory/50 border-t-ivory rounded-full animate-spin" />Generating…</>
          ) : "Generate Questions"}
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-slate">{preview.length} questions generated — preview:</p>
          <ul className="text-xs text-navy/80 space-y-0.5 max-h-28 overflow-y-auto bg-white border border-slate-line rounded p-2">
            {preview.map((q, i) => (
              <li key={i} className="truncate">
                <span className="text-slate mr-1">Step {q.step}·</span>{q.label}
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <button
              onClick={() => { onApply(preview, "replace"); setPreview(null); setPrompt(""); }}
              className="bg-navy text-ivory text-xs px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity"
            >
              Replace all
            </button>
            <button
              onClick={() => { onApply(preview, "append"); setPreview(null); setPrompt(""); }}
              className="border border-navy text-navy text-xs px-3 py-1.5 rounded-full hover:bg-navy/5 transition-colors"
            >
              Add to existing
            </button>
            <button
              onClick={() => { setPreview(null); }}
              className="text-xs text-slate hover:text-navy transition-colors"
            >
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CustomSurveyEditor({
  inviteId,
  initialQuestions,
  onClose,
}: {
  inviteId: string;
  initialQuestions: SurveyQuestion[];
  onClose: () => void;
}) {
  const [questions, setQuestions] = useState<SurveyQuestion[]>(initialQuestions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  async function save(qs: SurveyQuestion[]) {
    setSaving(true);
    setSaved(false);
    setSaveError("");
    try {
      await updateDoc(doc(getDb(), "survey-invites", inviteId), { customQuestions: qs });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      const msg = (err as { code?: string; message?: string }).code ?? (err as Error).message ?? "Save failed";
      setSaveError(msg);
      console.error("Failed to save custom questions:", err);
    } finally {
      setSaving(false);
    }
  }

  function handleSaveQuestion(updated: SurveyQuestion) {
    const next = questions.map((q) => (q.id === updated.id ? updated : q));
    setQuestions(next);
    setEditingId(null);
    save(next);
  }

  function handleDelete(id: string) {
    const next = questions.filter((q) => q.id !== id);
    setQuestions(next);
    save(next);
  }

  function handleAdd(step: number) {
    const newQ: SurveyQuestion = {
      id: `q_${Date.now()}`,
      step,
      label: "New question",
      type: "text",
      required: false,
    };
    const next = [...questions, newQ];
    setQuestions(next);
    setEditingId(newQ.id);
  }

  function handleReset() {
    if (!confirm("Reset to global default questions?")) return;
    setQuestions(DEFAULT_QUESTIONS);
    setEditingId(null);
    save(DEFAULT_QUESTIONS);
  }

  function handleAI(generated: SurveyQuestion[], mode: "replace" | "append") {
    const next = mode === "replace" ? generated : [...questions, ...generated];
    setQuestions(next);
    save(next);
  }

  return (
    <div className="bg-ivory">
      <div className="flex items-center justify-between px-5 py-3 bg-navy/5 border-b border-navy/10">
        <div>
          <h3 className="font-display text-base text-navy">Survey Builder</h3>
          <p className="text-xs text-slate mt-0.5">Questions for this client only — AI generation available below</p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-xs text-green-700 font-medium">Saved!</span>}
          {saving && <span className="text-xs text-slate">Saving…</span>}
          {saveError && <span className="text-xs text-red-600 max-w-[200px] truncate" title={saveError}>Error: {saveError}</span>}
          <button onClick={handleReset} className="text-xs text-slate hover:text-navy transition-colors underline underline-offset-2">
            Reset to defaults
          </button>
          <button onClick={onClose} className="text-xs text-slate hover:text-navy transition-colors font-medium">✕ Close</button>
        </div>
      </div>
      <div className="p-4">

      <AIGeneratorPanel onApply={handleAI} />

      <div className="mt-4">
      {STEP_LABELS.map((stepLabel, i) => {
        const stepNum = i + 1;
        const stepQs = questions.filter((q) => q.step === stepNum);
        return (
          <div key={stepNum} className="mb-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-5 h-5 rounded-full bg-navy text-ivory text-xs flex items-center justify-center font-medium flex-shrink-0">
                {stepNum}
              </span>
              <p className="text-xs font-medium text-navy uppercase tracking-wide">{stepLabel}</p>
            </div>
            <div className="space-y-2">
              {stepQs.map((q) =>
                editingId === q.id ? (
                  <QuestionEditor
                    key={q.id}
                    question={q}
                    onSave={handleSaveQuestion}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <QuestionRow
                    key={q.id}
                    q={q}
                    onEdit={() => setEditingId(q.id)}
                    onDelete={() => handleDelete(q.id)}
                  />
                )
              )}
            </div>
            <button
              onClick={() => handleAdd(stepNum)}
              className="mt-2 w-full border border-dashed border-slate-line text-slate hover:border-navy hover:text-navy text-xs py-2 rounded-lg transition-colors"
            >
              + Add question to Step {stepNum}
            </button>
          </div>
        );
      })}
      </div>
      </div>
    </div>
  );
}

export default function ClientsPage() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ clientName: "", clientEmail: "", notes: "" });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingQuestionsId, setEditingQuestionsId] = useState<string | null>(null);
  const [customQuestionsCache, setCustomQuestionsCache] = useState<Record<string, SurveyQuestion[]>>({});
  const [siteUrl, setSiteUrl] = useState("");
  const [pageError, setPageError] = useState("");
  const [createError, setCreateError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loadingEditorId, setLoadingEditorId] = useState<string | null>(null);

  useEffect(() => {
    setSiteUrl(window.location.origin);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/admin");
      } else {
        setAuthed(true);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, [router]);

  const loadInvites = useCallback(async () => {
    setDataLoading(true);
    setLoadError("");
    try {
      const q = query(collection(getDb(), "survey-invites"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setInvites(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Invite)));
    } catch {
      try {
        const snap = await getDocs(collection(getDb(), "survey-invites"));
        setInvites(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() } as Invite))
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        );
      } catch (err) {
        const msg = (err as { code?: string; message?: string }).code ?? (err as Error).message ?? "Failed to load clients";
        setLoadError(msg);
        console.error("Failed to load invites:", err);
      }
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) loadInvites();
  }, [authed, loadInvites]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clientName.trim()) return;
    setCreating(true);
    setCreateError("");
    try {
      await addDoc(collection(getDb(), "survey-invites"), {
        clientName: form.clientName.trim(),
        clientEmail: form.clientEmail.trim(),
        notes: form.notes.trim(),
        createdAt: new Date().toISOString(),
        status: "pending",
        submissionId: null,
      });
      setForm({ clientName: "", clientEmail: "", notes: "" });
      setShowForm(false);
      await loadInvites();
    } catch (err) {
      const msg = (err as { code?: string; message?: string }).code ?? (err as Error).message ?? "Failed to create client";
      setCreateError(msg);
      console.error("Failed to create invite:", err);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this client and their survey link?")) return;
    setPageError("");
    try {
      await deleteDoc(doc(getDb(), "survey-invites", id));
      setInvites((prev) => prev.filter((i) => i.id !== id));
      if (editingQuestionsId === id) setEditingQuestionsId(null);
    } catch (err) {
      const msg = (err as { code?: string; message?: string }).code ?? (err as Error).message ?? "Delete failed";
      setPageError(msg);
      console.error("Failed to delete:", err);
    }
  }

  async function openSurveyEditor(invite: Invite) {
    if (editingQuestionsId === invite.id) {
      setEditingQuestionsId(null);
      return;
    }
    setPageError("");
    // Open editor immediately so the user sees a response
    setEditingQuestionsId(invite.id);
    if (customQuestionsCache[invite.id]) return; // already cached
    setLoadingEditorId(invite.id);
    try {
      const snap = await getDoc(doc(getDb(), "survey-invites", invite.id));
      const data = snap.data();
      const qs =
        Array.isArray(data?.customQuestions) && data.customQuestions.length > 0
          ? (data.customQuestions as SurveyQuestion[])
          : DEFAULT_QUESTIONS;
      setCustomQuestionsCache((prev) => ({ ...prev, [invite.id]: qs }));
    } catch (err) {
      const msg = (err as { code?: string; message?: string }).code ?? (err as Error).message ?? "Failed to load questions";
      setPageError(msg);
      setCustomQuestionsCache((prev) => ({ ...prev, [invite.id]: DEFAULT_QUESTIONS }));
    } finally {
      setLoadingEditorId(null);
    }
  }

  function copyLink(id: string) {
    const url = `${siteUrl}/survey?c=${id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      }).catch(() => {
        // Clipboard API blocked — show the URL in a prompt so it can be manually copied
        window.prompt("Copy this survey link:", url);
      });
    } else {
      window.prompt("Copy this survey link:", url);
    }
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authed) return null;

  return (
    <div className="min-h-screen bg-ivory">
      <AdminNav />

      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="font-display text-3xl text-navy">Client Surveys</h1>
            <p className="text-slate text-sm mt-1">Each client gets their own unique survey link with custom questions</p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-2 bg-navy text-ivory text-sm px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            New Client
          </button>
        </div>

        <div className="mb-8 mt-4 bg-cream border border-slate-line rounded-xl px-5 py-4 text-sm text-navy/70 flex gap-3">
          <svg className="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M8 7v5M8 5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <p>
            Create a client, then click <strong className="text-navy">Edit Survey</strong> to build custom questions for that client — with AI generation.
            Copy their unique link and send it. The Survey Builder tab sets the <em>global default</em> used when no client link is shared.
          </p>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-cream rounded-2xl p-6 mb-8 space-y-4">
            <h2 className="font-display text-lg text-navy">Create invite link</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate mb-1 uppercase tracking-wide">
                  Client Name *
                </label>
                <input
                  required
                  value={form.clientName}
                  onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
                  placeholder="Jane Smith"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate mb-1 uppercase tracking-wide">
                  Client Email
                </label>
                <input
                  type="email"
                  value={form.clientEmail}
                  onChange={(e) => setForm((f) => ({ ...f, clientEmail: e.target.value }))}
                  placeholder="jane@business.com"
                  className={INPUT_CLASS}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate mb-1 uppercase tracking-wide">
                Notes (internal)
              </label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="e.g. Referred by Jiten, owns a salon in Hoboken"
                className={`${INPUT_CLASS} resize-y`}
              />
            </div>
            {createError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                Error: {createError}
              </p>
            )}
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={creating}
                className="bg-navy text-ivory text-sm px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {creating ? "Creating…" : "Create Link"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setCreateError(""); }}
                className="text-sm text-slate hover:text-navy transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {loadError && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-2">
            <span className="shrink-0 font-bold">!</span>
            <span>Could not load clients: {loadError}</span>
            <button onClick={() => { setLoadError(""); loadInvites(); }} className="ml-auto text-red-500 hover:text-red-700 underline text-xs">Retry</button>
          </div>
        )}

        {pageError && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-2">
            <span className="shrink-0 font-bold">!</span>
            <span>{pageError}</span>
            <button onClick={() => setPageError("")} className="ml-auto text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {dataLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-cream animate-pulse rounded-xl" />
            ))}
          </div>
        ) : invites.length === 0 ? (
          <div className="text-center py-20 text-slate border border-dashed border-slate-line rounded-2xl">
            <p className="text-lg">No invites yet.</p>
            <p className="text-sm mt-2">Create one to generate a unique survey link for a client.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {invites.map((invite) => (
              <div key={invite.id} className="bg-white border border-slate-line rounded-xl overflow-hidden">
                {/* Invite row */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-navy">{invite.clientName}</p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          invite.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-cream text-slate"
                        }`}
                      >
                        {invite.status}
                      </span>
                      {invite.customQuestions && invite.customQuestions.length > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-navy/10 text-navy font-medium">
                          {invite.customQuestions.length} custom questions
                        </span>
                      )}
                    </div>
                    {invite.clientEmail && (
                      <p className="text-xs text-slate mt-0.5">{invite.clientEmail}</p>
                    )}
                    {invite.notes && (
                      <p className="text-xs text-slate/70 mt-1 truncate">{invite.notes}</p>
                    )}
                    <p className="text-xs text-slate-line mt-1">{formatDate(invite.createdAt)}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    <button
                      onClick={() => openSurveyEditor(invite)}
                      disabled={loadingEditorId === invite.id}
                      className={`text-sm px-4 py-2 rounded-full font-medium transition-colors disabled:opacity-60 ${
                        editingQuestionsId === invite.id
                          ? "bg-navy text-ivory"
                          : "bg-navy/10 text-navy hover:bg-navy hover:text-ivory"
                      }`}
                    >
                      {loadingEditorId === invite.id
                        ? "Loading…"
                        : editingQuestionsId === invite.id
                        ? "▲ Close Survey Editor"
                        : "✎ Edit Survey"}
                    </button>
                    <button
                      onClick={() => copyLink(invite.id)}
                      className={`text-sm px-4 py-2 rounded-full border transition-colors ${
                        copiedId === invite.id
                          ? "border-green-500 text-green-700 bg-green-50"
                          : "border-slate-line text-slate hover:border-navy hover:text-navy"
                      }`}
                    >
                      {copiedId === invite.id ? "✓ Copied!" : "Copy survey link"}
                    </button>
                    <button
                      onClick={() => handleDelete(invite.id)}
                      className="text-xs text-slate hover:text-red-600 transition-colors px-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Survey link preview */}
                {!editingQuestionsId || editingQuestionsId !== invite.id ? (
                  <div className="border-t border-slate-line/50 bg-cream/50 px-5 py-2.5 flex items-center gap-3">
                    <span className="text-xs text-slate shrink-0">Survey link:</span>
                    <code className="text-xs text-navy/70 truncate flex-1">{siteUrl}/survey?c={invite.id}</code>
                    <button
                      onClick={() => copyLink(invite.id)}
                      className="text-xs text-slate hover:text-navy shrink-0 transition-colors"
                    >
                      {copiedId === invite.id ? "Copied!" : "Copy"}
                    </button>
                  </div>
                ) : null}

                {/* Inline survey editor */}
                {editingQuestionsId === invite.id && (
                  <div className="border-t border-navy/20">
                    {loadingEditorId === invite.id ? (
                      <div className="flex justify-center py-8">
                        <div className="w-5 h-5 border-2 border-navy border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : customQuestionsCache[invite.id] ? (
                      <CustomSurveyEditor
                        inviteId={invite.id}
                        initialQuestions={customQuestionsCache[invite.id]!}
                        onClose={() => setEditingQuestionsId(null)}
                      />
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
