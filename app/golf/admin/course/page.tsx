import type { Metadata } from "next";
import AdminShell from "../AdminShell";
import CourseAdmin from "./CourseAdmin";

export const metadata: Metadata = { title: "Admin · Course" };

export default function AdminCoursePage() {
  return (
    <AdminShell title="Course">
      <CourseAdmin />
    </AdminShell>
  );
}
