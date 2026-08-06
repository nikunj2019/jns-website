import type { Metadata } from "next";
import GolfHeader from "../components/GolfHeader";
import JNSBar from "../components/JNSBar";
import TeamList from "./TeamList";

export const metadata: Metadata = {
  title: "Teams",
  description: "Foursomes playing the Annual Stonegate Men's Golf Scramble.",
};

export default function TeamsPage() {
  return (
    <>
      <GolfHeader title="Teams" />
      <TeamList />
      <JNSBar compact />
    </>
  );
}
