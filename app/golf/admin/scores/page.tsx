import type { Metadata } from "next";
import AdminShell from "../AdminShell";
import ScoresAdmin from "./ScoresAdmin";

export const metadata: Metadata = { title: "Admin · Scores" };

export default function AdminScoresPage() {
  return (
    <AdminShell title="Scores">
      <ScoresAdmin />
    </AdminShell>
  );
}
