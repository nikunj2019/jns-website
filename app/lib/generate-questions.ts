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
- Keep labels concise and conversational (no apostrophes or special characters in strings)
- Generate at most 10 questions total
- Return ONLY a valid JSON array — no markdown, no code fences, no explanation, nothing else`;

// Walk bracket depth to find the matching ] for the first [, then try to
// repair truncated output by closing off at the last complete object.
function extractArray(text: string): unknown {
  const start = text.indexOf("[");
  if (start === -1) throw new Error("No JSON array found in response");

  // Track depth to find the closing bracket, respecting strings and escapes
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (esc) { esc = false; continue; }
    if (c === "\\" && inStr) { esc = true; continue; }
    if (c === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (c === "[" || c === "{") depth++;
    if (c === "]" || c === "}") {
      depth--;
      if (depth === 0) {
        try { return JSON.parse(text.slice(start, i + 1)); } catch { break; }
      }
    }
  }

  // Truncated — close off at the last complete object "}, " or "}"
  const slice = text.slice(start);
  for (const tail of ["}\n]", "},\n]", "  }\n]", "},", "}"]) {
    const idx = slice.lastIndexOf(tail);
    if (idx === -1) continue;
    const attempt = slice.slice(0, idx + tail.replace(/,\n]|,$/,"").length + 1) + "]";
    try { return JSON.parse(attempt); } catch { /* try next */ }
  }

  throw new Error("Could not parse questions from response — try again");
}

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

  const parsed = extractArray(text);
  if (!Array.isArray(parsed)) throw new Error("Response was not a JSON array");
  return parsed as SurveyQuestion[];
}

export const AI_AVAILABLE = !!process.env.NEXT_PUBLIC_GEMINI_API_KEY;
