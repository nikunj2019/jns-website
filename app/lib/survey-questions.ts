export type QuestionType = "text" | "email" | "tel" | "radio" | "checkbox" | "textarea" | "select";

export interface SurveyQuestion {
  id: string;
  step: number;
  label: string;
  type: QuestionType;
  options?: string[];
  required: boolean;
  placeholder?: string;
}

export const STEP_LABELS = ["About You", "Current Operations", "AI & Technology"];

export const DEFAULT_QUESTIONS: SurveyQuestion[] = [
  // Step 1: About You
  { id: "business_name", step: 1, label: "What's your business name?", type: "text", required: true, placeholder: "e.g. Studio Maven" },
  { id: "contact_name", step: 1, label: "Your name", type: "text", required: true, placeholder: "First and last name" },
  { id: "email", step: 1, label: "Email address", type: "email", required: true, placeholder: "you@yourbusiness.com" },
  { id: "phone", step: 1, label: "Phone number", type: "tel", required: false, placeholder: "(555) 000-0000" },
  { id: "business_type", step: 1, label: "What type of business do you run?", type: "select", required: true, options: ["Beauty / Salon / Spa", "Pet Services", "Restaurant / Food & Beverage", "Retail", "Healthcare / Medical", "Fitness / Wellness", "Home Services", "Other"] },
  { id: "staff_count", step: 1, label: "How many staff members do you have?", type: "radio", required: true, options: ["Just me", "2–5", "6–15", "16+"] },

  // Step 2: Current Operations
  { id: "booking_method", step: 2, label: "How do clients currently book with you? (Select all that apply)", type: "checkbox", required: false, options: ["Phone", "Text", "Website", "Instagram / Facebook", "Vagaro", "Square", "Mindbody", "Other"] },
  { id: "daily_frustration", step: 2, label: "What's your biggest daily frustration? (Select all that apply)", type: "checkbox", required: false, options: ["Missed calls", "Scheduling chaos", "Last-minute cancellations", "Marketing", "Client follow-up", "Collecting payments", "Other"] },
  { id: "missed_calls", step: 2, label: "How many calls do you think you miss each week?", type: "radio", required: false, options: ["0–5", "6–10", "10+", "I don't track this"] },
  { id: "current_tools", step: 2, label: "What tools or software do you currently use? (Select all)", type: "checkbox", required: false, options: ["Square", "Vagaro", "Mindbody", "Google Sheets / Docs", "QuickBooks", "None", "Other"] },

  // Step 3: AI & Technology
  { id: "ai_one_thing", step: 3, label: "If AI could help with ONE thing in your business, what would it be?", type: "textarea", required: false, placeholder: "e.g. Answer my calls when I'm with a client..." },
  { id: "features_interest", step: 3, label: "Which features interest you most? (Select all that apply)", type: "checkbox", required: false, options: ["AI Receptionist", "Online Booking", "Text Reminders", "Marketing Campaigns", "KPI Dashboard", "Client Notes", "Loyalty Program", "Online Payments"] },
  { id: "timeline", step: 3, label: "What's your timeline for making changes?", type: "radio", required: false, options: ["Ready now", "1–3 months", "3–6 months", "Just exploring"] },
  { id: "beta_interest", step: 3, label: "Would you be interested in joining a free beta if available?", type: "radio", required: false, options: ["Yes", "Maybe", "No"] },
  { id: "additional_info", step: 3, label: "Anything else you'd like us to know before the call?", type: "textarea", required: false, placeholder: "Share anything that would help us prepare..." },
];
