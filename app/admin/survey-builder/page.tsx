"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { getAuthInstance } from "../../lib/firebase";
import { fsGetDoc, fsSetDoc } from "../../lib/firestoreRest";
import {
  DEFAULT_SECTIONS,
  sectionsFromDoc,
  type SurveySection,
  type SurveyQuestion,
  type QuestionType,
} from "../../lib/survey-questions";
import { AdminNav } from "../AdminNav";
import { generateQuestionsWithAI, AI_AVAILABLE } from "../../lib/generate-questions";

const QUESTION_TYPES: QuestionType[] = ["text", "email", "tel", "radio", "checkbox", "textarea", "select"];

const INPUT =
  "w-full border border-slate-line bg-ivory px-3 py-2 text-sm text-navy placeholder-slate/60 focus:border-navy focus:outline-none transition-colors";

// ─── Question editor ──────────────────────────────────────────────────────────

function QuestionEditor({
  question, onSave, onCancel,
}: {
  question: SurveyQuestion; onSave: (q: SurveyQuestion) => void; onCancel: () => void;
}) {
  const [draft, setDraft] = useState<SurveyQuestion>({ ...question });
  const needsOptions = ["radio", "checkbox", "select"].includes(draft.type);

  return (
    <div className="bg-cream rounded-lg p-4 space-y-3 border border-slate-line">
      <div>
        <label className="block text-xs font-medium text-slate mb-1 uppercase tracking-wide">Question</label>
        <input value={draft.label} onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))} className={INPUT} placeholder="Question text" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate mb-1 uppercase tracking-wide">Type</label>
          <select value={draft.type} onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as QuestionType }))} className={INPUT}>
            {QUESTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="flex items-end pb-0.5">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={draft.required} onChange={(e) => setDraft((d) => ({ ...d, required: e.target.checked }))} className="w-4 h-4 border border-slate-line" />
            <span className="text-sm text-navy">Required</span>
          </label>
        </div>
      </div>
      {["text", "email", "tel", "textarea"].includes(draft.type) && (
        <div>
          <label className="block text-xs font-medium text-slate mb-1 uppercase tracking-wide">Placeholder</label>
          <input value={draft.placeholder ?? ""} onChange={(e) => setDraft((d) => ({ ...d, placeholder: e.target.value }))} className={INPUT} placeholder="Placeholder text" />
        </div>
      )}
      {needsOptions && (
        <div>
          <label className="block text-xs font-medium text-slate mb-1 uppercase tracking-wide">Options (comma-separated)</label>
          <textarea rows={2} value={(draft.options ?? []).join(", ")} onChange={(e) => setDraft((d) => ({ ...d, options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) }))} className={`${INPUT} resize-y`} placeholder="Option A, Option B, Option C" />
        </div>
      )}
      <div className="flex gap-2 pt-1">
        <button onClick={() => onSave(draft)} className="bg-navy text-ivory text-xs px-4 py-1.5 rounded-full hover:opacity-90 transition-opacity">Save</button>
        <button onClick={onCancel} className="text-xs text-slate hover:text-navy transition-colors">Cancel</button>
      </div>
    </div>
  );
}

// ─── Section component ────────────────────────────────────────────────────────

function SectionBlock({
  section,
  onUpdate,
  onDelete,
  canDelete,
}: {
  section: SurveySection;
  onUpdate: (s: SurveySection) => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelDraft, setLabelDraft] = useState(section.label);
  const [editingQId, setEditingQId] = useState<string | null>(null);

  function saveLabel() {
    const trimmed = labelDraft.trim();
    if (trimmed) onUpdate({ ...section, label: trimmed });
    setEditingLabel(false);
  }

  function addQuestion() {
    const newQ: SurveyQuestion = { id: `q_${Date.now()}`, label: "New question", type: "text", required: false };
    const next = { ...section, questions: [...section.questions, newQ] };
    onUpdate(next);
    setEditingQId(newQ.id);
  }

  function updateQuestion(updated: SurveyQuestion) {
    onUpdate({ ...section, questions: section.questions.map((q) => (q.id === updated.id ? updated : q)) });
    setEditingQId(null);
  }

  function deleteQuestion(id: string) {
    onUpdate({ ...section, questions: section.questions.filter((q) => q.id !== id) });
  }

  return (
    <div className="mb-6 border border-slate-line rounded-xl overflow-hidden">
      {/* Section header */}
      <div className="flex items-center justify-between px-4 py-3 bg-cream border-b border-slate-line gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-6 h-6 rounded-full bg-navy text-ivory text-xs flex items-center justify-center font-medium shrink-0">
            §
          </div>
          {editingLabel ? (
            <input
              autoFocus
              value={labelDraft}
              onChange={(e) => setLabelDraft(e.target.value)}
              onBlur={saveLabel}
              onKeyDown={(e) => { if (e.key === "Enter") saveLabel(); if (e.key === "Escape") setEditingLabel(false); }}
              className="flex-1 font-display text-lg text-navy bg-white border border-navy px-2 py-0.5 rounded focus:outline-none"
            />
          ) : (
            <button
              onClick={() => { setLabelDraft(section.label); setEditingLabel(true); }}
              className="font-display text-lg text-navy hover:text-navy/70 transition-colors text-left truncate"
              title="Click to rename"
            >
              {section.label}
              <span className="ml-2 text-xs text-slate font-sans font-normal normal-case tracking-normal">✏️</span>
            </button>
          )}
        </div>
        {canDelete && (
          <button
            onClick={() => { if (confirm(`Delete section "${section.label}" and all its questions?`)) onDelete(); }}
            className="shrink-0 text-xs text-slate hover:text-red-600 transition-colors"
          >
            Delete section
          </button>
        )}
      </div>

      {/* Questions */}
      <div className="p-4 space-y-2">
        {section.questions.length === 0 && (
          <p className="text-sm text-slate/60 text-center py-3">No questions yet — add one below.</p>
        )}
        {section.questions.map((q) => (
          <div key={q.id}>
            {editingQId === q.id ? (
              <QuestionEditor question={q} onSave={updateQuestion} onCancel={() => setEditingQId(null)} />
            ) : (
              <div className="flex items-start justify-between border border-slate-line bg-white px-4 py-3 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-navy font-medium truncate">{q.label}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-cream text-slate px-2 py-0.5 rounded-full">{q.type}</span>
                    {q.required && <span className="text-xs text-slate">required</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4 shrink-0">
                  <button onClick={() => setEditingQId(q.id)} className="text-sm text-slate hover:text-navy transition-colors">Edit</button>
                  <button onClick={() => deleteQuestion(q.id)} className="text-sm text-slate hover:text-red-600 transition-colors">Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}

        <button
          onClick={addQuestion}
          className="w-full border border-dashed border-slate-line text-slate hover:border-navy hover:text-navy text-sm py-2.5 rounded-lg transition-colors mt-1"
        >
          + Add Question
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SurveyBuilderPage() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [sections, setSections] = useState<SurveySection[]>(DEFAULT_SECTIONS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(getAuthInstance(), async (user) => {
      if (!user) { router.replace("/admin"); } else {
        setToken(await user.getIdToken());
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, [router]);

  const loadSections = useCallback(async (t: string) => {
    try {
      const docData = await fsGetDoc("survey-config", "questions", t);
      if (docData) setSections(sectionsFromDoc(docData));
    } catch (err) { console.error("Failed to load:", err); }
  }, []);

  useEffect(() => { if (token) loadSections(token); }, [token, loadSections]);

  async function save(next: SurveySection[]) {
    setSaving(true); setSaved(false); setSaveError("");
    try {
      const t = await getAuthInstance().currentUser!.getIdToken();
      await fsSetDoc("survey-config", "questions", { sections: next }, t);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError((err as Error).message ?? "Save failed");
    } finally { setSaving(false); }
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
    const newSec: SurveySection = { id: `sec_${Date.now()}`, label: "New Section", questions: [] };
    const next = [...sections, newSec];
    setSections(next); save(next);
  }

  async function handleReset() {
    if (!confirm("Reset to default sections and questions?")) return;
    setSections(DEFAULT_SECTIONS); save(DEFAULT_SECTIONS);
  }

  // AI generation
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPreview, setAiPreview] = useState<SurveySection[] | null>(null);
  const [aiError, setAiError] = useState("");

  async function handleAiGenerate() {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true); setAiError(""); setAiPreview(null);
    try {
      const qs = await generateQuestionsWithAI(aiPrompt);
      // Group generated questions into sections by step number
      const stepNums = Array.from(new Set(qs.map((q) => q.step ?? 1))).sort((a, b) => a - b);
      const generated: SurveySection[] = stepNums.map((step, i) => ({
        id: `sec_ai_${i}_${Date.now()}`,
        label: `Section ${i + 1}`,
        questions: qs.filter((q) => (q.step ?? 1) === step),
      }));
      setAiPreview(generated);
    } catch (err) { setAiError((err as Error).message || "Generation failed"); }
    finally { setAiGenerating(false); }
  }

  function applyAi(mode: "replace" | "append") {
    if (!aiPreview) return;
    const next = mode === "replace" ? aiPreview : [...sections, ...aiPreview];
    setSections(next); save(next); setAiPreview(null); setAiPrompt("");
  }

  if (authLoading) return (
    <div className="min-h-screen bg-ivory flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!token) return null;

  return (
    <div className="min-h-screen bg-ivory">
      <AdminNav />

      <div className="mx-auto max-w-3xl px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl text-navy">Survey Builder</h1>
            <p className="text-slate text-sm mt-1">
              Default survey — used when no client-specific link is shared.{" "}
              <a href="/admin/clients" className="underline hover:text-navy transition-colors">Per-client surveys →</a>
            </p>
          </div>
          <div className="flex items-center gap-4">
            {saved && <span className="text-sm text-green-700 font-medium">Saved!</span>}
            {saving && <span className="text-sm text-slate">Saving…</span>}
            {saveError && <span className="text-sm text-red-600 max-w-xs truncate" title={saveError}>Error: {saveError}</span>}
            <button onClick={handleReset} className="text-sm text-slate hover:text-navy transition-colors underline underline-offset-4">
              Reset to defaults
            </button>
          </div>
        </div>

        {/* AI generator */}
        <div className="mb-8 bg-navy/5 border border-navy/10 rounded-xl p-5 space-y-3">
          <p className="text-sm font-medium text-navy flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 12 12" fill="none"><path d="M6 1L7.5 4.5H11L8.25 6.75L9.25 10.5L6 8.25L2.75 10.5L3.75 6.75L1 4.5H4.5L6 1Z" fill="currentColor" /></svg>
            Generate with AI
          </p>
          {AI_AVAILABLE ? (
            <>
              <textarea rows={2} value={aiPrompt} onChange={(e) => { setAiPrompt(e.target.value); setAiPreview(null); }}
                placeholder="Describe the business, e.g. 'Beauty salon with 30 independent suite owners — focus on filling suites and missed calls'"
                className="w-full border border-slate-line bg-white px-4 py-3 text-sm text-navy placeholder-slate/60 focus:border-navy focus:outline-none transition-colors resize-none" />
              {aiError && <p className="text-xs text-red-600">{aiError}</p>}
              {!aiPreview ? (
                <button onClick={handleAiGenerate} disabled={aiGenerating || !aiPrompt.trim()}
                  className="inline-flex items-center gap-2 bg-navy text-ivory text-sm px-5 py-2.5 rounded-full hover:opacity-90 disabled:opacity-50 transition-opacity">
                  {aiGenerating ? <><span className="w-3.5 h-3.5 border border-ivory/50 border-t-ivory rounded-full animate-spin" />Generating…</> : "Generate Questions"}
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-slate">{aiPreview.reduce((n, s) => n + s.questions.length, 0)} questions across {aiPreview.length} sections generated</p>
                  <ul className="text-sm text-navy/80 space-y-1 max-h-36 overflow-y-auto bg-white border border-slate-line rounded-lg px-3 py-2">
                    {aiPreview.map((sec) => (
                      <li key={sec.id}>
                        <span className="font-medium text-navy text-xs uppercase tracking-wide">{sec.label}</span>
                        {sec.questions.map((q, i) => <div key={i} className="truncate ml-2 text-xs text-slate">· {q.label}</div>)}
                      </li>
                    ))}
                  </ul>
                  <div className="flex gap-3">
                    <button onClick={() => applyAi("replace")} className="bg-navy text-ivory text-sm px-4 py-2 rounded-full hover:opacity-90 transition-opacity">Replace all</button>
                    <button onClick={() => applyAi("append")} className="border border-navy text-navy text-sm px-4 py-2 rounded-full hover:bg-navy/5 transition-colors">Add to existing</button>
                    <button onClick={() => setAiPreview(null)} className="text-sm text-slate hover:text-navy transition-colors">Discard</button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-slate">Add <code className="font-mono bg-white px-1 rounded border border-slate-line">NEXT_PUBLIC_GEMINI_API_KEY</code> to GitHub secrets, then redeploy.</p>
          )}
        </div>

        {/* Sections */}
        {sections.map((sec) => (
          <SectionBlock
            key={sec.id}
            section={sec}
            onUpdate={updateSection}
            onDelete={() => deleteSection(sec.id)}
            canDelete={sections.length > 1}
          />
        ))}

        <button
          onClick={addSection}
          className="w-full border-2 border-dashed border-navy/20 text-navy/50 hover:border-navy hover:text-navy text-sm py-4 rounded-xl transition-colors font-medium"
        >
          + Add Section
        </button>
      </div>
    </div>
  );
}
