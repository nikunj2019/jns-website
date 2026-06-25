import type { SurveyQuestion } from "./survey-questions";

const SYSTEM_PROMPT = `You are a discovery survey designer for JNS Consulting, a technology consultancy that builds AI voice agents, dashboards, CRM systems, and automations for small businesses.

Generate survey questions as a JSON array. Each object must match this exact TypeScript type:
{
  id: string,        // unique snake_case identifier, e.g. "booking_pain_point"
  step: number,      // 1 = "About You", 2 = "Current Operations", 3 = "AI & Technology"
  label: string,     // the question text shown to the client
  type: "text" | "email" | "tel" | "radio" | "checkbox" | "textarea" | "select",
  options?: string[], // required when type is radio, checkbox, or select
  required: boolean,
  placeholder?: string  // optional, for text/email/tel/textarea types
}

Rules:
- Spread questions across steps 1, 2, and 3 naturally
- Use checkbox or radio for predefined choices, textarea for open-ended, text/email/tel for contact info
- Keep labels concise and conversational
- Return ONLY a valid JSON array — no markdown fences, no explanation, no extra text`;

export async function generateQuestionsWithAI(prompt: string): Promise<SurveyQuestion[]> {
  const apiKey = process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("NEXT_PUBLIC_ANTHROPIC_API_KEY is not set");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Anthropic API ${res.status}: ${body.slice(0, 120)}`);
  }

  const data = await res.json();
  const text: string = data?.content?.[0]?.text ?? "";

  // Strip any accidental markdown fences
  const cleaned = text.replace(/^```[a-z]*\n?/i, "").replace(/```$/i, "").trim();
  const parsed = JSON.parse(cleaned);

  if (!Array.isArray(parsed)) throw new Error("Response was not a JSON array");

  return parsed as SurveyQuestion[];
}

export const AI_AVAILABLE = !!process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY;
