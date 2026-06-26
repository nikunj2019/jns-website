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
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) throw new Error("NEXT_PUBLIC_GEMINI_API_KEY is not set");

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 8192, temperature: 0.7 },
      }),
    }
  );

  if (!res.ok) {
    if (res.status === 429) {
      throw new Error("Gemini free quota exceeded. Wait a minute and try again, or get a new key at aistudio.google.com.");
    }
    const body = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(body?.error?.message ?? `Gemini API error ${res.status}`);
  }

  const data = await res.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  // Extract the JSON array robustly — find first [ and last ]
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start)
    throw new Error("No JSON array found in response");

  const parsed = JSON.parse(text.slice(start, end + 1));
  if (!Array.isArray(parsed)) throw new Error("Response was not a JSON array");

  return parsed as SurveyQuestion[];
}

export const AI_AVAILABLE = !!process.env.NEXT_PUBLIC_GEMINI_API_KEY;
