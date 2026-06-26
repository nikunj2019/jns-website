export type QuestionType = "text" | "email" | "tel" | "radio" | "checkbox" | "textarea" | "select";

export interface SurveyQuestion {
  id: string;
  step?: number; // legacy field, kept for backward compat
  label: string;
  type: QuestionType;
  options?: string[];
  required: boolean;
  placeholder?: string;
}

export interface SurveySection {
  id: string;
  label: string;
  questions: SurveyQuestion[];
}

// Legacy step labels — used for migration from old flat format
export const STEP_LABELS = ["About You", "Current Operations", "AI & Technology"];

const DEFAULT_QUESTIONS_FLAT: SurveyQuestion[] = [
  { id: "business_name", step: 1, label: "What's your business name?", type: "text", required: true, placeholder: "e.g. Studio Maven" },
  { id: "contact_name", step: 1, label: "Your name", type: "text", required: true, placeholder: "First and last name" },
  { id: "email", step: 1, label: "Email address", type: "email", required: true, placeholder: "you@yourbusiness.com" },
  { id: "phone", step: 1, label: "Phone number", type: "tel", required: false, placeholder: "(555) 000-0000" },
  { id: "business_type", step: 1, label: "What type of business do you run?", type: "select", required: true, options: ["Beauty / Salon / Spa", "Pet Services", "Restaurant / Food & Beverage", "Retail", "Healthcare / Medical", "Fitness / Wellness", "Home Services", "Other"] },
  { id: "staff_count", step: 1, label: "How many staff members do you have?", type: "radio", required: true, options: ["Just me", "2–5", "6–15", "16+"] },
  { id: "booking_method", step: 2, label: "How do clients currently book with you?", type: "checkbox", required: false, options: ["Phone", "Text", "Website", "Instagram / Facebook", "Vagaro", "Square", "Mindbody", "Other"] },
  { id: "daily_frustration", step: 2, label: "What's your biggest daily frustration?", type: "checkbox", required: false, options: ["Missed calls", "Scheduling chaos", "Last-minute cancellations", "Marketing", "Client follow-up", "Collecting payments", "Other"] },
  { id: "missed_calls", step: 2, label: "How many calls do you miss each week?", type: "radio", required: false, options: ["0–5", "6–10", "10+", "I don't track this"] },
  { id: "current_tools", step: 2, label: "What tools or software do you currently use?", type: "checkbox", required: false, options: ["Square", "Vagaro", "Mindbody", "Google Sheets / Docs", "QuickBooks", "None", "Other"] },
  { id: "ai_one_thing", step: 3, label: "If AI could help with ONE thing in your business, what would it be?", type: "textarea", required: false, placeholder: "e.g. Answer my calls when I'm with a client..." },
  { id: "features_interest", step: 3, label: "Which features interest you most?", type: "checkbox", required: false, options: ["AI Receptionist", "Online Booking", "Text Reminders", "Marketing Campaigns", "KPI Dashboard", "Client Notes", "Loyalty Program", "Online Payments"] },
  { id: "timeline", step: 3, label: "What's your timeline for making changes?", type: "radio", required: false, options: ["Ready now", "1–3 months", "3–6 months", "Just exploring"] },
  { id: "beta_interest", step: 3, label: "Would you be interested in joining a free beta?", type: "radio", required: false, options: ["Yes", "Maybe", "No"] },
  { id: "additional_info", step: 3, label: "Anything else you'd like us to know before the call?", type: "textarea", required: false, placeholder: "Share anything that would help us prepare..." },
];

// Keep for legacy compat
export const DEFAULT_QUESTIONS = DEFAULT_QUESTIONS_FLAT;

export const DEFAULT_SECTIONS: SurveySection[] = [
  {
    id: "sec_1",
    label: "About You",
    questions: DEFAULT_QUESTIONS_FLAT.filter((q) => q.step === 1),
  },
  {
    id: "sec_2",
    label: "Current Operations",
    questions: DEFAULT_QUESTIONS_FLAT.filter((q) => q.step === 2),
  },
  {
    id: "sec_3",
    label: "AI & Technology",
    questions: DEFAULT_QUESTIONS_FLAT.filter((q) => q.step === 3),
  },
];

/** Convert a Firestore doc payload to sections, handling both old and new formats. */
export function sectionsFromDoc(doc: Record<string, unknown>): SurveySection[] {
  // New format
  if (Array.isArray(doc.sections) && (doc.sections as SurveySection[]).length > 0) {
    return doc.sections as SurveySection[];
  }
  // Legacy flat-questions format
  if (Array.isArray(doc.questions) && (doc.questions as SurveyQuestion[]).length > 0) {
    const qs = doc.questions as SurveyQuestion[];
    const steps = Array.from(new Set(qs.map((q) => q.step ?? 1))).sort((a, b) => a - b);
    return steps.map((step) => ({
      id: `sec_${step}`,
      label: STEP_LABELS[step - 1] ?? `Section ${step}`,
      questions: qs.filter((q) => (q.step ?? 1) === step),
    }));
  }
  return DEFAULT_SECTIONS;
}
