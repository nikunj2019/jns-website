"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { getAuthInstance } from "../../lib/firebase";
import {
  fsListDocs,
  fsAddDoc,
  fsPatchDoc,
  fsDeleteDoc,
} from "../../lib/firestoreRest";
import { AdminNav } from "../AdminNav";
import {
  DEFAULT_SECTIONS,
  sectionsFromDoc,
  type SurveySection,
  type SurveyQuestion,
  type QuestionType,
} from "../../lib/survey-questions";
import { generateQuestionsWithAI, AI_AVAILABLE } from "../../lib/generate-questions";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Invite {
  id: string;
  clientName: string;
  clientEmail: string;
  notes: string;
  createdAt: string;
  status: "pending" | "completed";
  submissionId?: string | null;
  customSections?: SurveySection[];
  _saving?: boolean;
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const INPUT =
  "w-full border border-slate-line bg-ivory px-4 py-3 text-sm text-navy placeholder-slate/60 focus:border-navy focus:outline-none transition-colors";

const SMALL_INPUT =
  "w-full border border-slate-line bg-white px-3 py-2 text-sm text-navy placeholder-slate/60 focus:border-navy focus:outline-none transition-colors";

const QUESTION_TYPES: QuestionType[] = [
  "text", "email", "tel", "radio", "checkbox", "textarea", "select",
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function QuestionEditor({
  question, onSave, onCancel,
}: {
  question: SurveyQuestion; onSave: (q: SurveyQuestion) => void; onCancel: () => void;
}) {
  const [draft, setDraft] = useState<SurveyQuestion>({ ...question });
  const needsOptions = ["radio", "checkbox", "select"].includes(draft.type);
  return (
    <div className="bg-cream rounded-lg p-3 space-y-3 text-sm border border-slate-line">
      <div>
        <label className="block text-xs font-medium text-slate mb-1 uppercase tracking-wide">Question</label>
        <input value={draft.label} onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))} className={SMALL_INPUT} placeholder="Question text" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-slate mb-1 uppercase tracking-wide">Type</label>
          <select value={draft.type} onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as QuestionType }))} className={SMALL_INPUT}>
            {QUESTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex items-end pb-0.5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={draft.required} onChange={(e) => setDraft((d) => ({ ...d, required: e.target.checked }))} className="w-4 h-4 border border-slate-line" />
            <span className="text-xs text-navy">Required</span>
          </label>
        </div>
      </div>
      {needsOptions && (
        <div>
          <label className="block text-xs font-medium text-slate mb-1 uppercase tracking-wide">Options (comma-separated)</label>
          <textarea rows={2} value={(draft.options ?? []).join(", ")} onChange={(e) => setDraft((d) => ({ ...d, options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))} className={`${SMALL_INPUT} resize-y`} placeholder="Option A, Option B" />
        </div>
      )}
      {["text", "email", "tel", "textarea"].includes(draft.type) && (
        <div>
          <label className="block text-xs font-medium text-slate mb-1 uppercase tracking-wide">Placeholder</label>
          <input value={draft.placeholder ?? ""} onChange={(e) => setDraft((d) => ({ ...d, placeholder: e.target.value }))} className={SMALL_INPUT} placeholder="Placeholder text" />
        </div>
      )}
      <div className="flex gap-2 pt-1">
        <button onClick={() => onSave(draft)} className="bg-navy text-ivory text-xs px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity">Save</button>
        <button onClick={onCancel} className="text-xs text-slate hover:text-navy transition-colors">Cancel</button>
      </div>
    </div>
  );
}

function SectionBlock({
  section, onUpdate, onDelete, canDelete,
}: {
  section: SurveySection; onUpdate: (s: SurveySection) => void; onDelete: () => void; canDelete: boolean;
}) {
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelDraft, setLabelDraft] = useState(section.label);
  const [editingQId, setEditingQId] = useState<string | null>(null);

  function saveLabel() {
    const t = labelDraft.trim();
    if (t) onUpdate({ ...section, label: t });
    setEditingLabel(false);
  }
  function addQuestion() {
    const q: SurveyQuestion = { id: `q_${Date.now()}`, label: "New question", type: "text", required: false };
    onUpdate({ ...section, questions: [...section.questions, q] });
    setEditingQId(q.id);
  }
  function updateQ(updated: SurveyQuestion) {
    onUpdate({ ...section, questions: section.questions.map((q) => (q.id === updated.id ? updated : q)) });
    setEditingQId(null);
  }
  function deleteQ(id: string) {
    onUpdate({ ...section, questions: section.questions.filter((q) => q.id !== id) });
  }

  return (
    <div className="mb-4 border border-slate-line rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2.5 bg-cream border-b border-slate-line gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="w-5 h-5 rounded-full bg-navy text-ivory text-xs flex items-center justify-center font-medium shrink-0">§</span>
          {editingLabel ? (
            <input autoFocus value={labelDraft} onChange={(e) => setLabelDraft(e.target.value)}
              onBlur={saveLabel} onKeyDown={(e) => { if (e.key === "Enter") saveLabel(); if (e.key === "Escape") setEditingLabel(false); }}
              className="flex-1 text-sm font-medium text-navy bg-white border border-navy px-2 py-0.5 rounded focus:outline-none" />
          ) : (
            <button onClick={() => { setLabelDraft(section.label); setEditingLabel(true); }}
              className="text-sm font-medium text-navy hover:text-navy/70 transition-colors text-left truncate" title="Click to rename">
              {section.label} <span className="text-xs text-slate font-normal">✏️</span>
            </button>
          )}
        </div>
        {canDelete && (
          <button onClick={() => { if (confirm(`Delete "${section.label}"?`)) onDelete(); }}
            className="shrink-0 text-xs text-slate hover:text-red-600 transition-colors">Delete</button>
        )}
      </div>
      <div className="p-3 space-y-2">
        {section.questions.length === 0 && <p className="text-xs text-slate/50 text-center py-2">No questions yet.</p>}
        {section.questions.map((q) => (
          <div key={q.id}>
            {editingQId === q.id ? (
              <QuestionEditor question={q} onSave={updateQ} onCancel={() => setEditingQId(null)} />
            ) : (
              <div className="flex items-start justify-between border border-slate-line bg-white px-3 py-2.5 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-navy font-medium truncate">{q.label}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs bg-cream text-slate px-1.5 py-0.5 rounded-full">{q.type}</span>
                    {q.required && <span className="text-xs text-slate">required</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                  <button onClick={() => setEditingQId(q.id)} className="text-xs text-slate hover:text-navy transition-colors">Edit</button>
                  <button onClick={() => deleteQ(q.id)} className="text-xs text-slate hover:text-red-600 transition-colors">✕</button>
                </div>
              </div>
            )}
          </div>
        ))}
        <button onClick={addQuestion} className="w-full border border-dashed border-slate-line text-slate hover:border-navy hover:text-navy text-xs py-2 rounded-lg transition-colors">
          + Add Question
        </button>
      </div>
    </div>
  );
}

function CustomSurveyEditor({
  inviteId, initialSections, token, onSaved, onClose,
}: {
  inviteId: string;
  initialSections: SurveySection[];
  token: string;
  onSaved: (sections: SurveySection[]) => void;
  onClose: () => void;
}) {
  const [sections, setSections] = useState<SurveySection[]>(initialSections);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPreview, setAiPreview] = useState<SurveySection[] | null>(null);
  const [aiError, setAiError] = useState("");

  async function save(next: SurveySection[]) {
    setSaving(true); setSaved(false); setSaveError("");
    try {
      await fsPatchDoc("survey-invites", inviteId, { customSections: next }, token);
      onSaved(next); setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch (err) { setSaveError((err as Error).message ?? "Save failed"); }
    finally { setSaving(false); }
  }

  function updateSection(updated: SurveySection) {
    const next = sections.map((s) => (s.id === updated.id ? updated : s));
    setSections(next); save(next);
  }
  function deleteSection(id: string) {
    const next = sections.filter((s) => s.id !== id);
    setSections(next); save(next);
  }
  function addSection() {
    const s: SurveySection = { id: `sec_${Date.now()}`, label: "New Section", questions: [] };
    const next = [...sections, s];
    setSections(next); save(next);
  }
  function handleReset() {
    if (!confirm("Reset to global default sections?")) return;
    setSections(DEFAULT_SECTIONS); save(DEFAULT_SECTIONS);
  }

  async function handleAiGenerate() {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true); setAiError(""); setAiPreview(null);
    try {
      const qs = await generateQuestionsWithAI(aiPrompt);
      const steps = Array.from(new Set(qs.map((q) => q.step ?? 1))).sort((a, b) => a - b);
      setAiPreview(steps.map((step, i) => ({
        id: `sec_ai_${i}_${Date.now()}`, label: `Section ${i + 1}`,
        questions: qs.filter((q) => (q.step ?? 1) === step),
      })));
    } catch (err) { setAiError((err as Error).message || "Generation failed"); }
    finally { setAiGenerating(false); }
  }

  function applyAi(mode: "replace" | "append") {
    if (!aiPreview) return;
    const next = mode === "replace" ? aiPreview : [...sections, ...aiPreview];
    setSections(next); save(next); setAiPreview(null); setAiPrompt("");
  }

  return (
    <div className="bg-ivory">
      <div className="flex items-center justify-between px-4 py-3 bg-navy/5 border-b border-navy/10 flex-wrap gap-2">
        <div>
          <p className="text-sm font-medium text-navy">Survey Builder</p>
          <p className="text-xs text-slate">Sections and questions for this client only</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {saved && <span className="text-xs text-green-700 font-medium">Saved!</span>}
          {saving && <span className="text-xs text-slate">Saving…</span>}
          {saveError && <span className="text-xs text-red-600 max-w-[180px] truncate" title={saveError}>Error: {saveError}</span>}
          <button onClick={handleReset} className="text-xs text-slate hover:text-navy transition-colors underline underline-offset-2">Reset</button>
          <button onClick={onClose} className="text-xs font-medium text-slate hover:text-navy transition-colors">✕ Close</button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* AI panel */}
        {AI_AVAILABLE ? (
          <div className="bg-navy/5 border border-navy/10 rounded-lg p-3 space-y-2">
            <p className="text-xs font-medium text-navy flex items-center gap-1.5">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 1L7.5 4.5H11L8.25 6.75L9.25 10.5L6 8.25L2.75 10.5L3.75 6.75L1 4.5H4.5L6 1Z" fill="currentColor" /></svg>
              Generate with AI
            </p>
            <textarea rows={2} value={aiPrompt} onChange={(e) => { setAiPrompt(e.target.value); setAiPreview(null); }}
              placeholder="Describe the client's business and focus areas"
              className="w-full border border-slate-line bg-white px-3 py-2 text-xs text-navy placeholder-slate/60 focus:border-navy focus:outline-none transition-colors resize-none" />
            {aiError && <p className="text-xs text-red-600">{aiError}</p>}
            {!aiPreview ? (
              <button onClick={handleAiGenerate} disabled={aiGenerating || !aiPrompt.trim()}
                className="inline-flex items-center gap-1.5 bg-navy text-ivory text-xs px-3 py-1.5 rounded-full hover:opacity-90 disabled:opacity-50 transition-opacity">
                {aiGenerating ? <><span className="w-2.5 h-2.5 border border-ivory/50 border-t-ivory rounded-full animate-spin" />Generating…</> : "Generate"}
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-slate">{aiPreview.reduce((n, s) => n + s.questions.length, 0)} questions in {aiPreview.length} sections</p>
                <div className="flex gap-2">
                  <button onClick={() => applyAi("replace")} className="bg-navy text-ivory text-xs px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity">Replace all</button>
                  <button onClick={() => applyAi("append")} className="border border-navy text-navy text-xs px-3 py-1.5 rounded-full hover:bg-navy/5 transition-colors">Append</button>
                  <button onClick={() => setAiPreview(null)} className="text-xs text-slate hover:text-navy transition-colors">Discard</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-xs text-slate bg-cream rounded-lg p-3 border border-slate-line">
            Add <code className="font-mono bg-white px-1 rounded">NEXT_PUBLIC_GEMINI_API_KEY</code> to enable AI.
          </div>
        )}

        {sections.map((sec) => (
          <SectionBlock key={sec.id} section={sec} onUpdate={updateSection} onDelete={() => deleteSection(sec.id)} canDelete={sections.length > 1} />
        ))}

        <button onClick={addSection} className="w-full border-2 border-dashed border-navy/20 text-navy/50 hover:border-navy hover:text-navy text-xs py-2.5 rounded-xl transition-colors">
          + Add Section
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ClientsPage() {
  const router = useRouter();

  const [authLoading, setAuthLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  const [invites, setInvites] = useState<Invite[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ clientName: "", clientEmail: "", notes: "" });
  const [createError, setCreateError] = useState("");

  const [editingQuestionsId, setEditingQuestionsId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pageError, setPageError] = useState("");
  const [siteUrl, setSiteUrl] = useState("");

  useEffect(() => { setSiteUrl(window.location.origin); }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(getAuthInstance(), async (user) => {
      if (!user) {
        router.replace("/admin");
      } else {
        const t = await user.getIdToken();
        setToken(t);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, [router]);

  async function getToken(): Promise<string> {
    const user = getAuthInstance().currentUser;
    if (!user) throw new Error("Not authenticated");
    return user.getIdToken();
  }

  async function loadInvites() {
    setDataLoading(true);
    setDataError("");
    try {
      const t = await getToken();
      const docs = await fsListDocs("survey-invites", t);
      const list = (docs as unknown as Invite[]).sort(
        (a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? "")
      );
      setInvites(list);
    } catch (err) {
      setDataError((err as Error).message ?? "Failed to load clients");
    } finally {
      setDataLoading(false);
    }
  }

  useEffect(() => {
    if (token) loadInvites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = form.clientName.trim();
    if (!name) return;
    setCreateError("");

    const tempId = `_tmp_${Date.now()}`;
    const tempInvite: Invite = {
      id: tempId,
      clientName: name,
      clientEmail: form.clientEmail.trim(),
      notes: form.notes.trim(),
      createdAt: new Date().toISOString(),
      status: "pending",
      submissionId: null,
      _saving: true,
    };

    setInvites((prev) => [tempInvite, ...prev]);
    setForm({ clientName: "", clientEmail: "", notes: "" });
    setShowForm(false);

    try {
      const t = await getToken();
      const newId = await fsAddDoc("survey-invites", {
        clientName: tempInvite.clientName,
        clientEmail: tempInvite.clientEmail,
        notes: tempInvite.notes,
        createdAt: tempInvite.createdAt,
        status: "pending",
        submissionId: null,
      }, t);
      setInvites((prev) =>
        prev.map((inv) => (inv.id === tempId ? { ...inv, id: newId, _saving: false } : inv))
      );
    } catch (err) {
      setInvites((prev) => prev.filter((inv) => inv.id !== tempId));
      setForm({ clientName: name, clientEmail: tempInvite.clientEmail, notes: tempInvite.notes });
      setShowForm(true);
      setCreateError((err as Error).message ?? "Failed to create client");
    }
  }

  async function handleDelete(id: string) {
    if (id.startsWith("_tmp_")) return;
    if (!confirm("Delete this client and their survey link?")) return;
    setPageError("");
    const backup = invites.find((inv) => inv.id === id);
    setInvites((prev) => prev.filter((inv) => inv.id !== id));
    if (editingQuestionsId === id) setEditingQuestionsId(null);
    try {
      const t = await getToken();
      await fsDeleteDoc("survey-invites", id, t);
    } catch (err) {
      if (backup) setInvites((prev) => [backup, ...prev]);
      setPageError((err as Error).message ?? "Delete failed");
    }
  }

  function toggleEditor(id: string) {
    if (id.startsWith("_tmp_")) return;
    setEditingQuestionsId((prev) => (prev === id ? null : id));
  }

  function handleSectionsUpdated(inviteId: string, sections: SurveySection[]) {
    setInvites((prev) =>
      prev.map((inv) => (inv.id === inviteId ? { ...inv, customSections: sections } : inv))
    );
  }

  function copyLink(id: string) {
    if (id.startsWith("_tmp_")) return;
    const url = `${siteUrl}/survey?c=${id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      }).catch(() => window.prompt("Copy this link:", url));
    } else {
      window.prompt("Copy this link:", url);
    }
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch { return iso; }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!token) return null;

  return (
    <div className="min-h-screen bg-ivory">
      <AdminNav />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="font-display text-3xl text-navy">Client Surveys</h1>
            <p className="text-slate text-sm mt-1">Each client gets a unique survey link with custom questions</p>
          </div>
          <button
            onClick={() => { setShowForm((v) => !v); setCreateError(""); }}
            className="shrink-0 inline-flex items-center gap-2 bg-navy text-ivory text-sm px-4 py-2.5 rounded-full hover:opacity-90 transition-opacity"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            New Client
          </button>
        </div>

        {/* Create form */}
        {showForm && (
          <form onSubmit={handleCreate} className="bg-cream rounded-2xl p-5 mb-6 space-y-4">
            <h2 className="font-display text-lg text-navy">Create invite link</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate mb-1 uppercase tracking-wide">Client Name *</label>
                <input
                  required
                  value={form.clientName}
                  onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
                  placeholder="Salon On Point"
                  className={INPUT}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate mb-1 uppercase tracking-wide">Client Email</label>
                <input
                  type="email"
                  value={form.clientEmail}
                  onChange={(e) => setForm((f) => ({ ...f, clientEmail: e.target.value }))}
                  placeholder="owner@business.com"
                  className={INPUT}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate mb-1 uppercase tracking-wide">Notes (internal)</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="e.g. Referred by Jiten, owns a salon in Hoboken"
                className={`${INPUT} resize-y`}
              />
            </div>
            {createError && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                Error: {createError}
              </p>
            )}
            <div className="flex gap-3">
              <button type="submit" className="bg-navy text-ivory text-sm px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity">
                Create Link
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

        {/* Page-level error */}
        {pageError && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-2">
            <span className="shrink-0 font-bold">!</span>
            <span className="flex-1">{pageError}</span>
            <button onClick={() => setPageError("")} className="text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* Info banner */}
        <div className="mb-6 bg-cream border border-slate-line rounded-xl px-4 py-3 text-sm text-navy/70 flex gap-3">
          <svg className="shrink-0 mt-0.5" width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2" />
            <path d="M8 7v5M8 5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p>
            Create a client → click <strong className="text-navy">Edit Survey</strong> to build
            custom questions → copy their unique link and send it. The{" "}
            <a href="/admin/survey-builder" className="underline hover:text-navy transition-colors">Survey Builder</a>{" "}
            sets the global default.
          </p>
        </div>

        {/* List */}
        {dataLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-navy border-t-transparent rounded-full animate-spin" />
          </div>
        ) : dataError ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-slate text-sm">
              Could not load clients:{" "}
              <span className="text-red-600 font-mono text-xs">{dataError}</span>
            </p>
            <button
              onClick={loadInvites}
              className="text-sm text-navy underline underline-offset-4 hover:opacity-70 transition-opacity"
            >
              Try again
            </button>
          </div>
        ) : invites.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-slate-line rounded-2xl">
            <p className="text-slate">No clients yet.</p>
            <p className="text-slate text-sm mt-1">Click "New Client" above to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invites.map((invite) => {
              const isTemp = invite.id.startsWith("_tmp_");
              const isEditing = editingQuestionsId === invite.id;
              return (
                <div key={invite.id} className="bg-white border border-slate-line rounded-xl overflow-hidden">
                  <div className="px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-navy">{invite.clientName}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            invite.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : "bg-cream text-slate"
                          }`}>
                            {isTemp ? "saving…" : invite.status}
                          </span>
                          {!isTemp && invite.customSections && invite.customSections.length > 0 && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-navy/10 text-navy font-medium">
                              {invite.customSections.reduce((n, s) => n + s.questions.length, 0)} custom questions
                            </span>
                          )}
                        </div>
                        {invite.clientEmail && (
                          <p className="text-xs text-slate mt-0.5">{invite.clientEmail}</p>
                        )}
                        {invite.notes && (
                          <p className="text-xs text-slate/60 mt-0.5 truncate">{invite.notes}</p>
                        )}
                        <p className="text-xs text-slate-line mt-1">{formatDate(invite.createdAt)}</p>
                      </div>

                      {!isTemp && (
                        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                          <button
                            onClick={() => toggleEditor(invite.id)}
                            className={`text-sm px-3 py-1.5 rounded-full font-medium transition-colors ${
                              isEditing
                                ? "bg-navy text-ivory"
                                : "bg-navy/10 text-navy hover:bg-navy hover:text-ivory"
                            }`}
                          >
                            {isEditing ? "Close Editor" : "Edit Survey"}
                          </button>
                          <button
                            onClick={() => copyLink(invite.id)}
                            className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                              copiedId === invite.id
                                ? "border-green-500 text-green-700 bg-green-50"
                                : "border-slate-line text-slate hover:border-navy hover:text-navy"
                            }`}
                          >
                            {copiedId === invite.id ? "✓ Copied!" : "Copy link"}
                          </button>
                          <button
                            onClick={() => handleDelete(invite.id)}
                            className="text-xs text-slate hover:text-red-600 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>

                    {!isTemp && !isEditing && (
                      <div className="mt-3 pt-3 border-t border-slate-line/50 flex items-center gap-3">
                        <span className="text-xs text-slate shrink-0">Link:</span>
                        <code className="text-xs text-navy/60 truncate flex-1">
                          {siteUrl}/survey?c={invite.id}
                        </code>
                        <button
                          onClick={() => copyLink(invite.id)}
                          className="text-xs text-slate hover:text-navy shrink-0 transition-colors"
                        >
                          {copiedId === invite.id ? "Copied!" : "Copy"}
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditing && token && (
                    <div className="border-t border-navy/20">
                      <CustomSurveyEditor
                        key={invite.id}
                        inviteId={invite.id}
                        initialSections={
                          invite.customSections && invite.customSections.length > 0
                            ? invite.customSections
                            : DEFAULT_SECTIONS
                        }
                        token={token}
                        onSaved={(sections) => handleSectionsUpdated(invite.id, sections)}
                        onClose={() => setEditingQuestionsId(null)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
