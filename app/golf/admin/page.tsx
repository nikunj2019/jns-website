import type { Metadata } from "next";
import AdminShell from "./AdminShell";
import EventAdmin from "./EventAdmin";

export const metadata: Metadata = { title: "Admin · Event" };

export default function AdminEventPage() {
  return (
    <AdminShell title="Event">
      <EventAdmin />
    </AdminShell>
  );
}
