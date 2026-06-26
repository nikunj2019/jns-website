// Firestore REST API — plain HTTPS fetch, no gRPC-Web/WebChannel.
// Admin pages pass a Firebase Auth ID token; public pages omit it.

const pid = () => process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
const base = () =>
  `https://firestore.googleapis.com/v1/projects/${pid()}/databases/(default)/documents`;

// ─── Typed-value helpers ──────────────────────────────────────────────────────

type FV = Record<string, unknown>;

function toFV(v: unknown): FV {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number")
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === "string") return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toFV) } };
  if (typeof v === "object") {
    const fields: Record<string, FV> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>))
      fields[k] = toFV(val);
    return { mapValue: { fields } };
  }
  return { stringValue: String(v) };
}

function fromFV(fv: FV): unknown {
  if ("nullValue" in fv) return null;
  if ("booleanValue" in fv) return fv.booleanValue as boolean;
  if ("integerValue" in fv) return Number(fv.integerValue);
  if ("doubleValue" in fv) return fv.doubleValue as number;
  if ("stringValue" in fv) return fv.stringValue as string;
  if ("timestampValue" in fv) return fv.timestampValue as string;
  if ("referenceValue" in fv) return fv.referenceValue as string;
  if ("arrayValue" in fv) {
    const av = fv.arrayValue as { values?: FV[] };
    return (av.values ?? []).map(fromFV);
  }
  if ("mapValue" in fv) {
    const mv = fv.mapValue as { fields?: Record<string, FV> };
    const obj: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(mv.fields ?? {})) obj[k] = fromFV(val);
    return obj;
  }
  return null;
}

function docToObj(raw: { name: string; fields?: Record<string, FV> }): Record<string, unknown> {
  const id = raw.name.split("/").pop()!;
  const obj: Record<string, unknown> = { id };
  for (const [k, v] of Object.entries(raw.fields ?? {})) obj[k] = fromFV(v);
  return obj;
}

// ─── HTTP helper ──────────────────────────────────────────────────────────────

async function req(
  url: string,
  { token, ms = 12_000, ...opts }: RequestInit & { token?: string; ms?: number } = {}
): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    if (opts.body) headers["Content-Type"] = "application/json";
    const res = await fetch(url, { ...opts, headers, signal: ctrl.signal });
    if (res.status === 204 || res.headers.get("content-length") === "0") return null;
    const body = await res.json();
    if (!res.ok) {
      const msg =
        (body as { error?: { message?: string } })?.error?.message ?? `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return body;
  } catch (err) {
    if ((err as Error).name === "AbortError")
      throw new Error("Request timed out — check your internet connection.");
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** List all documents in a collection (max 300). Returns plain objects with `id`. */
export async function fsListDocs(col: string, token: string): Promise<Record<string, unknown>[]> {
  const data = (await req(`${base()}/${col}`, { token })) as {
    documents?: { name: string; fields?: Record<string, FV> }[];
  } | null;
  return (data?.documents ?? []).map(docToObj);
}

/** Get a single document. Returns null if not found. Token optional for public reads. */
export async function fsGetDoc(
  col: string,
  id: string,
  token?: string
): Promise<Record<string, unknown> | null> {
  try {
    const data = (await req(`${base()}/${col}/${id}`, { token })) as {
      name: string;
      fields?: Record<string, FV>;
    };
    return docToObj(data);
  } catch {
    return null;
  }
}

/** Create a new document (auto-generated ID). Returns the new document ID. */
export async function fsAddDoc(
  col: string,
  data: Record<string, unknown>,
  token?: string
): Promise<string> {
  const fields: Record<string, FV> = {};
  for (const [k, v] of Object.entries(data)) fields[k] = toFV(v);
  const doc = (await req(`${base()}/${col}`, {
    token,
    method: "POST",
    body: JSON.stringify({ fields }),
  })) as { name: string };
  return doc.name.split("/").pop()!;
}

/** Overwrite specific fields on a document (merge/patch). Token optional for public writes. */
export async function fsPatchDoc(
  col: string,
  id: string,
  data: Record<string, unknown>,
  token?: string
): Promise<void> {
  const fields: Record<string, FV> = {};
  for (const [k, v] of Object.entries(data)) fields[k] = toFV(v);
  const mask = Object.keys(data)
    .map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`)
    .join("&");
  await req(`${base()}/${col}/${id}?${mask}`, {
    token,
    method: "PATCH",
    body: JSON.stringify({ fields }),
  });
}

/** Completely overwrite a document (set). */
export async function fsSetDoc(
  col: string,
  id: string,
  data: Record<string, unknown>,
  token: string
): Promise<void> {
  const fields: Record<string, FV> = {};
  for (const [k, v] of Object.entries(data)) fields[k] = toFV(v);
  await req(`${base()}/${col}/${id}`, {
    token,
    method: "PATCH",
    body: JSON.stringify({ fields }),
  });
}

/** Delete a document. Token required (admin-only). */
export async function fsDeleteDoc(col: string, id: string, token: string): Promise<void> {
  await req(`${base()}/${col}/${id}`, { token, method: "DELETE" });
}
