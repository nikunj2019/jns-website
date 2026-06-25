"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { getDoc, setDoc, doc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { DEFAULT_QUESTIONS, STEP_LABELS, type SurveyQuestion, type QuestionType } from "../../lib/survey-questions";
import { AdminNav } from "../AdminNav";

const QUESTION_TYPES: QuestionType[] = ["text", "email", "tel", "radio", "checkbox", "textarea", "select"];

const INPUT_CLASS =
  "w-full border border-slate-line bg-ivory px-3 py-2 text-sm text-navy placeholder-slate/60 focus:border-navy focus:outline-none transition-colors";

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
    <div className="bg-cream rounded-xl p-5 space-y-4 text-sm">
      <div>
        <label className="block text-xs font-medium text-slate mb-1 uppercase tracking-wide">Label</label>
        <input
          value={draft.label}
          onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
          className={INPUT_CLASS}
          placeholder="Question label"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate mb-1 uppercase tracking-wide">Type</label>
          <select
            value={draft.type}
            onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value as QuestionType }))}
            className={INPUT_CLASS}
          >
            {QUESTION_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate mb-1 uppercase tracking-wide">Step</label>
          <select
            value={draft.step}
            onChange={(e) => setDraft((d) => ({ ...d, step: Number(e.target.value) }))}
            className={INPUT_CLASS}
          >
            {STEP_LABELS.map((label, i) => (
              <option key={i + 1} value={i + 1}>{i + 1} — {label}</option>
            ))}
          </select>
        </div>
      </div>

      {(draft.type === "text" || draft.type === "email" || draft.type === "tel" || draft.type === "textarea") && (
        <div>
          <label className="block text-xs font-medium text-slate mb-1 uppercase tracking-wide">Placeholder</label>
          <input
            value={draft.placeholder ?? ""}
            onChange={(e) => setDraft((d) => ({ ...d, placeholder: e.target.value }))}
            className={INPUT_CLASS}
            placeholder="Placeholder text"
          />
        </div>
      )}

      {needsOptions && (
        <div>
          <label className="block text-xs font-medium text-slate mb-1 uppercase tracking-wide">
            Options (comma-separated)
          </label>
          <textarea
            rows={3}
            value={(draft.options ?? []).join(", ")}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                options: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              }))
            }
            className={`${INPUT_CLASS} resize-y`}
            placeholder="Option A, Option B, Option C"
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
        <span className="text-sm text-navy">Required</span>
      </label>

      <div className="flex gap-3 pt-2">
        <button
          onClick={() => onSave(draft)}
          className="bg-navy text-ivory text-sm px-4 py-2 rounded-full hover:bg-navy-700 transition-colors"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="text-sm text-slate hover:text-navy transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function SurveyBuilderPage() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [questions, setQuestions] = useState<SurveyQuestion[]>(DEFAULT_QUESTIONS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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

  const loadQuestions = useCallback(async () => {
    try {
      const snap = await getDoc(doc(db, "survey-config", "questions"));
      if (snap.exists()) {
        const data = snap.data();
        if (Array.isArray(data.questions) && data.questions.length > 0) {
          setQuestions(data.questions as SurveyQuestion[]);
        }
      }
    } catch (err) {
      console.error("Failed to load questions:", err);
    }
  }, []);

  useEffect(() => {
    if (authed) loadQuestions();
  }, [authed, loadQuestions]);

  async function saveToFirestore(qs: SurveyQuestion[]) {
    setSaving(true);
    setSaved(false);
    try {
      await setDoc(doc(db, "survey-config", "questions"), { questions: qs });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setSaving(false);
    }
  }

  function handleSaveQuestion(updated: SurveyQuestion) {
    const next = questions.map((q) => (q.id === updated.id ? updated : q));
    setQuestions(next);
    setEditingId(null);
    saveToFirestore(next);
  }

  function handleDelete(id: string) {
    const next = questions.filter((q) => q.id !== id);
    setQuestions(next);
    saveToFirestore(next);
  }

  function handleAddQuestion(step: number) {
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

  async function handleReset() {
    if (!confirm("Reset to default questions? This will overwrite your current questions.")) return;
    setQuestions(DEFAULT_QUESTIONS);
    setEditingId(null);
    await saveToFirestore(DEFAULT_QUESTIONS);
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

      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl text-navy">Survey Builder</h1>
            <p className="text-slate text-sm mt-1">Edit the questions shown on the public survey</p>
          </div>
          <div className="flex items-center gap-4">
            {saved && (
              <span className="text-sm text-green-700 font-medium">Saved!</span>
            )}
            {saving && (
              <span className="text-sm text-slate">Saving…</span>
            )}
            <button
              onClick={handleReset}
              className="text-sm text-slate hover:text-navy transition-colors underline underline-offset-4"
            >
              Reset to defaults
            </button>
          </div>
        </div>

        {STEP_LABELS.map((stepLabel, i) => {
          const stepNum = i + 1;
          const stepQs = questions.filter((q) => q.step === stepNum);
          return (
            <div key={stepNum} className="mb-10">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-6 h-6 rounded-full bg-navy text-ivory text-xs flex items-center justify-center font-medium">
                  {stepNum}
                </span>
                <h2 className="font-display text-xl text-navy">{stepLabel}</h2>
              </div>

              <div className="space-y-3">
                {stepQs.map((q) => (
                  <div key={q.id}>
                    {editingId === q.id ? (
                      <QuestionEditor
                        question={q}
                        onSave={handleSaveQuestion}
                        onCancel={() => setEditingId(null)}
                      />
                    ) : (
                      <div className="flex items-start justify-between border border-slate-line bg-white px-4 py-3 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-navy font-medium truncate">{q.label}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs bg-cream text-slate px-2 py-0.5 rounded-full">{q.type}</span>
                            {q.required && (
                              <span className="text-xs text-slate">required</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                          <button
                            onClick={() => setEditingId(q.id)}
                            className="text-sm text-slate hover:text-navy transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(q.id)}
                            className="text-sm text-slate hover:text-red-600 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleAddQuestion(stepNum)}
                className="mt-3 w-full border border-dashed border-slate-line text-slate hover:border-navy hover:text-navy text-sm py-3 rounded-lg transition-colors"
              >
                + Add Question to Step {stepNum}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
