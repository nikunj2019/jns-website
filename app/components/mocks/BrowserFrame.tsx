import type { ReactNode } from "react";

type Props = {
  url: string;
  children: ReactNode;
  className?: string;
};

/**
 * A subtle, restrained browser chrome — feels like a product screenshot
 * without being a photoreal Chrome lookalike.
 */
export default function BrowserFrame({ url, children, className }: Props) {
  return (
    <div
      className={`overflow-hidden border border-slate-line bg-ivory ${className ?? ""}`}
    >
      {/* Window bar */}
      <div className="flex items-center gap-3 border-b border-slate-line bg-cream/50 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-slate/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate/30" />
        </div>
        <div className="ml-2 flex-1">
          <div className="inline-flex items-center gap-2 rounded-sm border border-slate-line bg-ivory px-3 py-1 text-[0.6875rem] text-slate font-mono">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path
                d="M3 4.5V3.5C3 2.4 3.9 1.5 5 1.5C6.1 1.5 7 2.4 7 3.5V4.5M2.5 4.5H7.5V8.5H2.5V4.5Z"
                stroke="currentColor"
                strokeWidth="0.8"
                strokeLinecap="square"
              />
            </svg>
            <span>{url}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-ivory">{children}</div>
    </div>
  );
}
