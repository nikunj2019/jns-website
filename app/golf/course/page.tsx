import type { Metadata } from "next";
import Link from "next/link";
import GolfHeader from "../components/GolfHeader";
import CourseView from "./CourseView";

export const metadata: Metadata = {
  title: "Course Map",
  description:
    "Interactive map of The Trophy Club with live GPS distances, hole by hole.",
};

export default function CoursePage() {
  return (
    <>
      <GolfHeader
        title="Course Map"
        right={
          <Link
            href="/golf/course/scorecard/"
            aria-label="Scorecard"
            className="flex h-10 w-10 items-center justify-center rounded-full text-cream-golf/80 transition-colors hover:bg-cream-golf/10"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect
                x="4"
                y="3"
                width="16"
                height="18"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="M8 8h8M8 12h8M8 16h5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </Link>
        }
      />
      <CourseView />
    </>
  );
}
