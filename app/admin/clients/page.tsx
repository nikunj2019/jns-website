"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { collection, addDoc, getDocs, orderBy, query, doc, deleteDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { AdminNav } from "../AdminNav";

interface Invite {
  id: string;
  clientName: string;
  clientEmail: string;
  notes: string;
  createdAt: string;
  status: "pending" | "completed";
  submissionId?: string | null;
}

const INPUT_CLASS =
  "w-full border border-slate-line bg-ivory px-4 py-3 text-sm text-navy placeholder-slate/60 focus:border-navy focus:outline-none transition-colors";

export default function ClientsPage() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ clientName: "", clientEmail: "", notes: "" });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [siteUrl, setSiteUrl] = useState("");

  useEffect(() => {
    setSiteUrl(window.location.origin);
  }, []);

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

  const loadInvites = useCallback(async () => {
    setDataLoading(true);
    try {
      const q = query(collection(db, "survey-invites"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setInvites(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Invite)));
    } catch {
      try {
        const snap = await getDocs(collection(db, "survey-invites"));
        setInvites(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() } as Invite))
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        );
      } catch (err) {
        console.error("Failed to load invites:", err);
      }
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) loadInvites();
  }, [authed, loadInvites]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clientName.trim()) return;
    setCreating(true);
    try {
      await addDoc(collection(db, "survey-invites"), {
        clientName: form.clientName.trim(),
        clientEmail: form.clientEmail.trim(),
        notes: form.notes.trim(),
        createdAt: new Date().toISOString(),
        status: "pending",
        submissionId: null,
      });
      setForm({ clientName: "", clientEmail: "", notes: "" });
      setShowForm(false);
      await loadInvites();
    } catch (err) {
      console.error("Failed to create invite:", err);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this invite link?")) return;
    try {
      await deleteDoc(doc(db, "survey-invites", id));
      setInvites((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  }

  function copyLink(id: string) {
    const url = `${siteUrl}/survey?c=${id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authed) return null;

  return (
    <div className="min-h-screen bg-ivory">
      <AdminNav />

      <div className="mx-auto max-w-4xl px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl text-navy">Client Invites</h1>
            <p className="text-slate text-sm mt-1">
              Generate unique survey links per client
            </p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-2 bg-navy text-ivory text-sm px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M6 1v10M1 6h10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            New Invite
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="bg-cream rounded-2xl p-6 mb-8 space-y-4">
            <h2 className="font-display text-lg text-navy">Create invite link</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate mb-1 uppercase tracking-wide">
                  Client Name *
                </label>
                <input
                  required
                  value={form.clientName}
                  onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
                  placeholder="Jane Smith"
                  className={INPUT_CLASS}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate mb-1 uppercase tracking-wide">
                  Client Email
                </label>
                <input
                  type="email"
                  value={form.clientEmail}
                  onChange={(e) => setForm((f) => ({ ...f, clientEmail: e.target.value }))}
                  placeholder="jane@business.com"
                  className={INPUT_CLASS}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate mb-1 uppercase tracking-wide">
                Notes (internal)
              </label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="e.g. Referred by Jiten, owns a salon in Hoboken"
                className={`${INPUT_CLASS} resize-y`}
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={creating}
                className="bg-navy text-ivory text-sm px-5 py-2.5 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {creating ? "Creating…" : "Create Link"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="text-sm text-slate hover:text-navy transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {dataLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-cream animate-pulse rounded-xl" />
            ))}
          </div>
        ) : invites.length === 0 ? (
          <div className="text-center py-20 text-slate border border-dashed border-slate-line rounded-2xl">
            <p className="text-lg">No invites yet.</p>
            <p className="text-sm mt-2">
              Create one to generate a unique survey link for a client.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="bg-white border border-slate-line rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-navy text-sm">{invite.clientName}</p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        invite.status === "completed"
                          ? "bg-green-100 text-green-700"
                          : "bg-cream text-slate"
                      }`}
                    >
                      {invite.status}
                    </span>
                  </div>
                  {invite.clientEmail && (
                    <p className="text-xs text-slate mt-0.5">{invite.clientEmail}</p>
                  )}
                  {invite.notes && (
                    <p className="text-xs text-slate/70 mt-1 truncate">{invite.notes}</p>
                  )}
                  <p className="text-xs text-slate-line mt-1">{formatDate(invite.createdAt)}</p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <code className="hidden sm:block text-xs text-slate bg-cream px-2 py-1 rounded font-mono truncate max-w-[200px]">
                    /survey?c={invite.id}
                  </code>
                  <button
                    onClick={() => copyLink(invite.id)}
                    className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${
                      copiedId === invite.id
                        ? "border-green-500 text-green-700 bg-green-50"
                        : "border-slate-line text-slate hover:border-navy hover:text-navy"
                    }`}
                  >
                    {copiedId === invite.id ? "Copied!" : "Copy link"}
                  </button>
                  <button
                    onClick={() => handleDelete(invite.id)}
                    className="text-xs text-slate hover:text-red-600 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
