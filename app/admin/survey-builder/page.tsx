"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { getAuthInstance } from "../../lib/firebase";
import { fsGetDoc, fsSetDoc } from "../../lib/firestoreRest";
import {
  DEFAULT_SECTIONS,
  sectionsFromDoc,
  type SurveySection,
  type SurveyQuestion,
} from "../../lib/survey-questions";
import { AdminNav } from "../AdminNav";
import { generateQuestionsWithAI, AI_AVAILABLE } from "../../lib/generate-questions";
import { SectionBlock, QuestionDragOverlay, applyDragEnd } from "../survey-shared";

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SurveyBuilderPage() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [sections, setSections] = useState<SurveySection[]>(DEFAULT_SECTIONS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  // DnD
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [activeQuestion, setActiveQuestion] = useState<SurveyQuestion | null>(null);

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

  // DnD handlers
  function findQuestion(id: string): SurveyQuestion | null {
    for (const sec of sections) {
      const q = sec.questions.find((q) => q.id === id);
      if (q) return q;
    }
    return null;
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveQuestion(findQuestion(String(e.active.id)));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveQuestion(null);
    const next = applyDragEnd(e, sections);
    if (next) { setSections(next); save(next); }
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

        {/* Sections with DnD */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {sections.map((sec) => (
            <SectionBlock
              key={sec.id}
              section={sec}
              onUpdate={updateSection}
              onDelete={() => deleteSection(sec.id)}
              canDelete={sections.length > 1}
            />
          ))}

          <DragOverlay>
            {activeQuestion && <QuestionDragOverlay question={activeQuestion} />}
          </DragOverlay>
        </DndContext>

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
