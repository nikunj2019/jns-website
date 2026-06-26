"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { collection, addDoc, getDoc, doc, updateDoc } from "firebase/firestore";
import { getDb } from "../lib/firebase";
import { DEFAULT_QUESTIONS, STEP_LABELS, type SurveyQuestion } from "../lib/survey-questions";
import Button from "../components/Button";

const INPUT_CLASS =
  "w-full border border-slate-line bg-ivory px-4 py-3 text-sm text-navy placeholder-slate/60 focus:border-navy focus:outline-none transition-colors";

function SurveyContent() {
  const searchParams = useSearchParams();
  const inviteId = searchParams.get("c");

  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [questions, setQuestions] = useState<SurveyQuestion[]>(DEFAULT_QUESTIONS);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [inviteClientName, setInviteClientName] = useState("");

  useEffect(() => {
    if (inviteId) return; // invite-specific questions take priority; skip global load
    async function loadQuestions() {
      try {
        const snap = await getDoc(doc(getDb(), "survey-config", "questions"));
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.questions) && data.questions.length > 0) {
            setQuestions(data.questions as SurveyQuestion[]);
          }
        }
      } catch {
        // fall back to defaults on error
      }
    }
    loadQuestions();
  }, [inviteId]);

  useEffect(() => {
    if (!inviteId) return;
    async function loadInvite() {
      try {
        const snap = await getDoc(doc(getDb(), "survey-invites", inviteId!));
        if (snap.exists()) {
          const data = snap.data();
          setInviteClientName(data.clientName || "");
          if (Array.isArray(data.customQuestions) && data.customQuestions.length > 0) {
            setQuestions(data.customQuestions as SurveyQuestion[]);
          } else {
            // No custom questions on invite — load global config
            try {
              const globalSnap = await getDoc(doc(getDb(), "survey-config", "questions"));
              if (globalSnap.exists()) {
                const gd = globalSnap.data();
                if (Array.isArray(gd.questions) && gd.questions.length > 0) {
                  setQuestions(gd.questions as SurveyQuestion[]);
                }
              }
            } catch {
              // stay on defaults
            }
          }
          setAnswers((prev) => ({
            ...prev,
            ...(data.clientName ? { contact_name: data.clientName } : {}),
            ...(data.clientEmail ? { email: data.clientEmail } : {}),
          }));
        }
      } catch {
        // continue without invite data
      }
    }
    loadInvite();
  }, [inviteId]);

  const stepQuestions = questions.filter((q) => q.step === step);
  const totalSteps = STEP_LABELS.length;

  function getAnswer(id: string): string | string[] {
    return answers[id] ?? "";
  }

  function setAnswer(id: string, value: string | string[]) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  }

  function toggleCheckbox(id: string, option: string) {
    const current = (answers[id] as string[]) ?? [];
    const next = current.includes(option)
      ? current.filter((v) => v !== option)
      : [...current, option];
    setAnswer(id, next);
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    for (const q of stepQuestions) {
      if (!q.required) continue;
      const val = answers[q.id];
      if (!val || (Array.isArray(val) ? val.length === 0 : val.trim() === "")) {
        newErrors[q.id] = "This field is required.";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleNext() {
    if (!validate()) return;
    setStep((s) => s + 1);
  }

  function handleBack() {
    setStep((s) => s - 1);
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        ...answers,
        submittedAt: new Date().toISOString(),
        step_completed: 3,
      };
      if (inviteId) payload.inviteId = inviteId;

      const docRef = await addDoc(collection(getDb(), "survey-submissions"), payload);

      if (inviteId) {
        try {
          await updateDoc(doc(getDb(), "survey-invites", inviteId), {
            status: "completed",
            submissionId: docRef.id,
          });
        } catch {
          // non-critical — submission is already saved
        }
      }

      setSubmitted(true);
    } catch (err) {
      console.error("Submission error:", err);
    } finally {
      setSubmitting(false);
    }
  }

  const businessName = (answers["business_name"] as string) || inviteClientName || "there";

  return (
    <div className="min-h-screen bg-ivory flex flex-col">
      {/* Header */}
      <header className="py-6 px-6 border-b border-slate-line">
        <div className="mx-auto max-w-2xl flex items-center gap-4">
          <Link href="/" aria-label="JNS Consulting, Home">
            <span className="relative inline-block" style={{ width: 48, height: 48 }}>
              <Image
                src="/jns-logo.png"
                alt="JNS Consulting"
                fill
                sizes="48px"
                className="scale-[1.45] object-contain"
                priority
              />
            </span>
          </Link>
          <div>
            <p className="brand-eyebrow text-slate">JNS Consulting</p>
            <p className="font-display text-lg text-navy">Discovery Survey</p>
          </div>
        </div>
      </header>

      <main className="flex-1 py-12 px-6">
        <div className="mx-auto max-w-2xl">
          {submitted ? (
            <SuccessScreen businessName={businessName} />
          ) : (
            <>
              {/* Progress indicator */}
              <div className="mb-10">
                <div className="flex items-center gap-0">
                  {STEP_LABELS.map((label, i) => {
                    const n = i + 1;
                    const isActive = n === step;
                    const isComplete = n < step;
                    return (
                      <div key={n} className="flex items-center flex-1 last:flex-none">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                              isActive
                                ? "bg-navy text-ivory"
                                : isComplete
                                ? "bg-navy text-ivory"
                                : "bg-cream text-slate border border-slate-line"
                            }`}
                          >
                            {isComplete ? (
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path
                                  d="M2.5 7L5.5 10L11.5 4"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            ) : (
                              n
                            )}
                          </div>
                          <span
                            className={`mt-2 text-xs whitespace-nowrap ${
                              isActive ? "text-navy font-medium" : "text-slate"
                            }`}
                          >
                            {label}
                          </span>
                        </div>
                        {i < STEP_LABELS.length - 1 && (
                          <div
                            className={`h-px flex-1 mx-2 mb-5 transition-colors ${
                              isComplete ? "bg-navy" : "bg-slate-line"
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.22, ease: "easeInOut" }}
                >
                  <h2 className="font-display text-2xl text-navy mb-8">
                    {STEP_LABELS[step - 1]}
                  </h2>

                  <div className="space-y-8">
                    {stepQuestions.map((q) => (
                      <QuestionField
                        key={q.id}
                        question={q}
                        value={getAnswer(q.id)}
                        error={errors[q.id]}
                        onChange={(val) => setAnswer(q.id, val)}
                        onToggle={(opt) => toggleCheckbox(q.id, opt)}
                      />
                    ))}
                  </div>

                  {/* Navigation */}
                  <div className="flex items-center justify-between mt-12 pt-8 border-t border-slate-line">
                    {step > 1 ? (
                      <button
                        onClick={handleBack}
                        className="text-sm text-slate hover:text-navy transition-colors flex items-center gap-2"
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path
                            d="M12 7H2M2 7L6.5 2.5M2 7L6.5 11.5"
                            stroke="currentColor"
                            strokeWidth="1.25"
                            strokeLinecap="square"
                          />
                        </svg>
                        Back
                      </button>
                    ) : (
                      <div />
                    )}
                    {step < totalSteps ? (
                      <Button variant="primary" onClick={handleNext}>
                        Next
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={submitting}
                      >
                        {submitting ? "Submitting…" : "Submit"}
                      </Button>
                    )}
                  </div>
                </motion.div>
              </AnimatePresence>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function QuestionField({
  question,
  value,
  error,
  onChange,
  onToggle,
}: {
  question: SurveyQuestion;
  value: string | string[];
  error?: string;
  onChange: (val: string) => void;
  onToggle: (option: string) => void;
}) {
  const { id, label, type, options, required, placeholder } = question;

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-navy mb-2">
        {label}
        {required && <span className="text-slate ml-1">*</span>}
      </label>

      {(type === "text" || type === "email" || type === "tel") && (
        <input
          id={id}
          type={type}
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={INPUT_CLASS}
        />
      )}

      {type === "select" && (
        <select
          id={id}
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          className={`${INPUT_CLASS} cursor-pointer`}
        >
          <option value="">Select an option…</option>
          {options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}

      {type === "textarea" && (
        <textarea
          id={id}
          value={value as string}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className={`${INPUT_CLASS} resize-y`}
        />
      )}

      {type === "radio" && (
        <div className="space-y-2">
          {options?.map((opt) => {
            const selected = value === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onChange(opt)}
                className={`w-full text-left px-4 py-3 border text-sm transition-colors ${
                  selected
                    ? "border-navy bg-navy/5 text-navy font-medium"
                    : "border-slate-line bg-ivory text-navy hover:border-navy/50"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                      selected ? "border-navy" : "border-slate-line"
                    }`}
                  >
                    {selected && <span className="w-2 h-2 rounded-full bg-navy" />}
                  </span>
                  {opt}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {type === "checkbox" && (
        <div className="space-y-2">
          {options?.map((opt) => {
            const selected = Array.isArray(value) && value.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onToggle(opt)}
                className={`w-full text-left px-4 py-3 border text-sm transition-colors ${
                  selected
                    ? "border-navy bg-navy/5 text-navy font-medium"
                    : "border-slate-line bg-ivory text-navy hover:border-navy/50"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`w-4 h-4 border-2 flex-shrink-0 flex items-center justify-center ${
                      selected ? "border-navy bg-navy" : "border-slate-line"
                    }`}
                  >
                    {selected && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path
                          d="M1.5 5L4 7.5L8.5 2.5"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </span>
                  {opt}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function SuccessScreen({ businessName }: { businessName: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="text-center py-16"
    >
      <div className="mx-auto mb-8 w-16 h-16 rounded-full bg-navy flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path
            d="M5 14L11 20L23 8"
            stroke="#f7f5f0"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h2 className="font-display text-3xl text-navy mb-4">Thank you, {businessName}!</h2>
      <p className="text-slate max-w-md mx-auto mb-10 leading-relaxed">
        We&apos;ve received your answers and will review them before your discovery call.
        We&apos;ll be in touch shortly.
      </p>
      <Link
        href="/"
        className="text-sm text-slate hover:text-navy transition-colors underline underline-offset-4"
      >
        Return to JNS Consulting
      </Link>
    </motion.div>
  );
}

export default function SurveyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-ivory flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <SurveyContent />
    </Suspense>
  );
}
