"use client";

/** Shared bits for the organizer screens. Dark theme, chunky touch targets. */

export const inputClass =
  "w-full rounded-lg border border-cream-golf/20 bg-fairway-900 px-3 py-2.5 text-[0.9rem] text-cream-golf placeholder-cream-golf/30 focus:border-brass focus:outline-none";

export function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-cream-golf/12 bg-fairway-800 p-4">
      <h2 className="font-display text-lg text-cream-golf">{title}</h2>
      {description && (
        <p className="mt-1 text-[0.78rem] leading-relaxed text-cream-golf/50">{description}</p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-[0.62rem] uppercase tracking-[0.14em] text-cream-golf/45">
        {label}
      </span>
      <span className="mt-1 block">{children}</span>
      {hint && <span className="mt-1 block text-[0.7rem] text-cream-golf/35">{hint}</span>}
    </label>
  );
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const styles = {
    primary: "bg-cream-golf text-fairway-900 hover:opacity-90",
    ghost: "border border-cream-golf/25 text-cream-golf hover:bg-cream-golf/10",
    danger: "border border-red-500/40 text-red-300 hover:bg-red-500/10",
  } as const;

  return (
    <button
      {...props}
      className={`rounded-lg px-4 py-2.5 text-[0.82rem] font-medium transition-colors disabled:opacity-50 ${styles[variant]} ${className}`}
    />
  );
}

export function SaveNote({ state, error }: { state: string; error?: string }) {
  if (state === "saving") return <p className="text-[0.75rem] text-cream-golf/45">Saving…</p>;
  if (state === "saved") return <p className="text-[0.75rem] text-green-300">Saved</p>;
  if (state === "error")
    return <p className="text-[0.75rem] text-red-300">{error ?? "Couldn't save."}</p>;
  return null;
}

/**
 * Firestore rejects writes from anyone not on the admin allowlist in
 * firestore.rules — surface that clearly rather than as a raw error string.
 */
export function saveErrorMessage(err: unknown): string {
  const message = (err as Error).message ?? "";
  if (/PERMISSION_DENIED|Missing or insufficient/i.test(message)) {
    return "Firestore rejected that write. Is this address on the admin list in firestore.rules?";
  }
  if (/timed out|Failed to fetch|NetworkError/i.test(message)) {
    return "No connection — the change wasn't saved.";
  }
  return message || "Couldn't save.";
}
