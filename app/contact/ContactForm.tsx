"use client";

import { useState, type FormEvent } from "react";
import Button from "../components/Button";

const SERVICES = [
  { id: "ai-voice", label: "AI Voice Agents" },
  { id: "custom-builds", label: "Custom Software" },
  { id: "automation", label: "Workflow Automation" },
  { id: "not-sure", label: "Not sure yet" },
];

const TIMEFRAMES = [
  { id: "asap", label: "ASAP" },
  { id: "this-quarter", label: "This quarter" },
  { id: "next-quarter", label: "Next quarter" },
  { id: "exploring", label: "Just exploring" },
];

export default function ContactForm() {
  const [service, setService] = useState<string>("not-sure");
  const [timeframe, setTimeframe] = useState<string>("this-quarter");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = (data.get("name") as string) || "";
    const email = (data.get("email") as string) || "";
    const company = (data.get("company") as string) || "";
    const message = (data.get("message") as string) || "";

    const serviceLabel =
      SERVICES.find((s) => s.id === service)?.label ?? "Not sure";
    const timeframeLabel =
      TIMEFRAMES.find((t) => t.id === timeframe)?.label ?? "Not specified";

    const subject = `New project enquiry from ${name}${company ? ` (${company})` : ""}`;
    const body = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Company: ${company || "Not specified"}`,
      `Service: ${serviceLabel}`,
      `Timeframe: ${timeframeLabel}`,
      "",
      "Message:",
      message,
    ].join("\n");

    const mailto = `mailto:hello@jnsconsulting.ai?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    window.location.href = mailto;
    setSubmitted(true);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* Name + Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <Field label="Your name" htmlFor="name">
          <input
            id="name"
            name="name"
            type="text"
            required
            autoComplete="name"
            className="input"
            placeholder="Jane Doe"
          />
        </Field>
        <Field label="Email" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="input"
            placeholder="jane@business.com"
          />
        </Field>
      </div>

      <Field label="Company" htmlFor="company" optional>
        <input
          id="company"
          name="company"
          type="text"
          autoComplete="organization"
          className="input"
          placeholder="Acme Co."
        />
      </Field>

      {/* Service */}
      <Field label="What can we help with?">
        <div className="mt-2 flex flex-wrap gap-2">
          {SERVICES.map((s) => (
            <Chip
              key={s.id}
              active={service === s.id}
              onClick={() => setService(s.id)}
            >
              {s.label}
            </Chip>
          ))}
        </div>
      </Field>

      {/* Timeframe */}
      <Field label="Timeframe">
        <div className="mt-2 flex flex-wrap gap-2">
          {TIMEFRAMES.map((t) => (
            <Chip
              key={t.id}
              active={timeframe === t.id}
              onClick={() => setTimeframe(t.id)}
            >
              {t.label}
            </Chip>
          ))}
        </div>
      </Field>

      {/* Message */}
      <Field label="What's slow, broken, or unbuilt?" htmlFor="message">
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          className="input resize-y"
          placeholder="A few sentences is plenty. We'll ask follow-ups."
        />
      </Field>

      <div className="flex flex-col sm:flex-row sm:items-center gap-6 pt-2">
        <Button size="lg">Send enquiry</Button>
        <p className="text-xs text-slate max-w-sm leading-relaxed">
          We&apos;ll open your email client with this pre-filled. Nothing is
          stored on a server.
        </p>
      </div>

      {submitted && (
        <p className="text-sm text-navy bg-cream border border-slate-line px-4 py-3">
          Your email client should have opened with the message pre-filled.
          If it didn&apos;t, write us directly at{" "}
          <a className="underline" href="mailto:hello@jnsconsulting.ai">
            hello@jns.consulting
          </a>
          .
        </p>
      )}

      <style>{`
        .input {
          display: block;
          width: 100%;
          background-color: transparent;
          border: 0;
          border-bottom: 1px solid var(--color-slate-line);
          padding: 0.625rem 0;
          font-family: var(--font-sans);
          font-size: 1rem;
          color: var(--color-navy);
          outline: none;
          transition: border-color 0.2s ease;
        }
        .input::placeholder {
          color: var(--color-slate);
        }
        .input:focus {
          border-bottom-color: var(--color-navy);
        }
        textarea.input {
          border: 1px solid var(--color-slate-line);
          padding: 0.875rem 1rem;
        }
        textarea.input:focus {
          border-color: var(--color-navy);
        }
      `}</style>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  optional,
  children,
}: {
  label: string;
  htmlFor?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="brand-eyebrow text-slate flex items-center gap-3"
      >
        <span>{label}</span>
        {optional && (
          <span className="normal-case tracking-normal text-slate/80 lowercase">
            optional
          </span>
        )}
      </label>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-sm px-4 py-2 border transition-colors ${
        active
          ? "bg-navy text-ivory border-navy"
          : "bg-transparent text-navy border-slate-line hover:border-navy"
      }`}
    >
      {children}
    </button>
  );
}
