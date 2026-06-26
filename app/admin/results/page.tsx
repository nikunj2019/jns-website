"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { auth, getDb } from "../../lib/firebase";
import { AdminNav } from "../AdminNav";

interface Submission {
  id: string;
  business_name?: string;
  contact_name?: string;
  email?: string;
  business_type?: string;
  features_interest?: string | string[];
  beta_interest?: string;
  submittedAt?: string;
  [key: string]: unknown;
}

export default function ResultsPage() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/admin");
      } else {
        setAuthed(true);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, [router]);

  const loadSubmissions = useCallback(async () => {
    setDataLoading(true);
    try {
      const q = query(collection(getDb(), "survey-submissions"), orderBy("submittedAt", "desc"));
      const snap = await getDocs(q);
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Submission));
      setSubmissions(docs);
    } catch {
      // orderBy might fail without index, try without ordering
      try {
        const snap = await getDocs(collection(getDb(), "survey-submissions"));
        const docs = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Submission))
          .sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""));
        setSubmissions(docs);
      } catch (err) {
        console.error("Failed to load submissions:", err);
      }
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) loadSubmissions();
  }, [authed, loadSubmissions]);

  function exportCsv() {
    if (submissions.length === 0) return;
    const allKeys = Array.from(
      new Set(submissions.flatMap((s) => Object.keys(s).filter((k) => k !== "id")))
    );
    const header = ["id", ...allKeys].join(",");
    const rows = submissions.map((s) => {
      return ["id", ...allKeys]
        .map((k) => {
          const val = k === "id" ? s.id : s[k];
          const str = Array.isArray(val) ? val.join("; ") : String(val ?? "");
          return `"${str.replace(/"/g, '""')}"`;
        })
        .join(",");
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `survey-submissions-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function formatDate(iso?: string) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
      return iso;
    }
  }

  function truncate(val: string | string[] | undefined, max = 40) {
    if (!val) return "—";
    const str = Array.isArray(val) ? val.join(", ") : val;
    return str.length > max ? str.slice(0, max) + "…" : str;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authed) return null;

  const mostRecent = submissions[0]?.submittedAt;

  return (
    <div className="min-h-screen bg-ivory">
      <AdminNav />

      <div className="mx-auto max-w-7xl px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl text-navy">Survey Results</h1>
            <p className="text-slate text-sm mt-1">All discovery survey submissions</p>
          </div>
          <button
            onClick={exportCsv}
            disabled={submissions.length === 0}
            className="inline-flex items-center gap-2 border border-navy text-navy text-sm px-4 py-2 rounded-full hover:bg-navy hover:text-ivory transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2v7M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Export CSV
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8 max-w-xs">
          <div className="bg-cream rounded-xl p-4">
            <p className="brand-eyebrow text-slate mb-1">Total</p>
            <p className="font-display text-3xl text-navy">{submissions.length}</p>
          </div>
          <div className="bg-cream rounded-xl p-4">
            <p className="brand-eyebrow text-slate mb-1">Latest</p>
            <p className="text-sm text-navy font-medium">{formatDate(mostRecent)}</p>
          </div>
        </div>

        {/* Table */}
        {dataLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 bg-cream animate-pulse rounded" />
            ))}
          </div>
        ) : submissions.length === 0 ? (
          <div className="text-center py-20 text-slate">
            <p className="text-lg">No submissions yet.</p>
            <p className="text-sm mt-2">Share the survey link to start collecting responses.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-line text-left">
                  <th className="pb-3 pr-4 brand-eyebrow text-slate font-normal">Date</th>
                  <th className="pb-3 pr-4 brand-eyebrow text-slate font-normal">Business</th>
                  <th className="pb-3 pr-4 brand-eyebrow text-slate font-normal">Type</th>
                  <th className="pb-3 pr-4 brand-eyebrow text-slate font-normal">Email</th>
                  <th className="pb-3 pr-4 brand-eyebrow text-slate font-normal">Features</th>
                  <th className="pb-3 brand-eyebrow text-slate font-normal">Beta</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <>
                    <tr
                      key={s.id}
                      onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}
                      className="border-b border-slate-line/50 cursor-pointer hover:bg-cream/50 transition-colors"
                    >
                      <td className="py-4 pr-4 text-slate">{formatDate(s.submittedAt)}</td>
                      <td className="py-4 pr-4 text-navy font-medium">{s.business_name || "—"}</td>
                      <td className="py-4 pr-4 text-slate">{s.business_type || "—"}</td>
                      <td className="py-4 pr-4 text-slate">{s.email || "—"}</td>
                      <td className="py-4 pr-4 text-slate">{truncate(s.features_interest as string | string[] | undefined)}</td>
                      <td className="py-4 text-slate">{s.beta_interest || "—"}</td>
                    </tr>
                    {expandedId === s.id && (
                      <tr key={`${s.id}-expanded`}>
                        <td colSpan={6} className="py-4 px-0">
                          <div className="bg-cream rounded-xl p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            {Object.entries(s)
                              .filter(([k]) => k !== "id")
                              .map(([k, v]) => (
                                <div key={k}>
                                  <p className="brand-eyebrow text-slate mb-1">{k.replace(/_/g, " ")}</p>
                                  <p className="text-navy">
                                    {Array.isArray(v) ? v.join(", ") : String(v ?? "—")}
                                  </p>
                                </div>
                              ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
