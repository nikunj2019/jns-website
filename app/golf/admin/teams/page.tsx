import type { Metadata } from "next";
import AdminShell from "../AdminShell";
import TeamsAdmin from "./TeamsAdmin";

export const metadata: Metadata = { title: "Admin · Teams" };

export default function AdminTeamsPage() {
  return (
    <AdminShell title="Teams">
      <TeamsAdmin />
    </AdminShell>
  );
}
