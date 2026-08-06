import type { Metadata } from "next";
import GolfHeader from "../components/GolfHeader";
import JNSBar from "../components/JNSBar";
import ScoreEntry from "./ScoreEntry";

export const metadata: Metadata = {
  title: "Enter Scores",
  description: "Enter your foursome's scramble score, hole by hole.",
};

export default function ScorePage() {
  return (
    <>
      <GolfHeader title="Enter Scores" />
      <ScoreEntry />
      <JNSBar compact />
    </>
  );
}
