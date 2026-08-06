import type { Metadata } from "next";
import AdminShell from "../../AdminShell";
import TraceEditor from "./TraceEditor";

export const metadata: Metadata = { title: "Admin · Trace course" };

export default function AdminTracePage() {
  return (
    <AdminShell title="Trace the course">
      <TraceEditor />
    </AdminShell>
  );
}
