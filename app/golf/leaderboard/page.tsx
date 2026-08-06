import type { Metadata } from "next";
import GolfHeader from "../components/GolfHeader";
import JNSBar from "../components/JNSBar";
import Leaderboard from "./Leaderboard";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Live scramble scoring for the Annual Stonegate Men's Golf Scramble.",
};

export default function LeaderboardPage() {
  return (
    <>
      <GolfHeader title="Leaderboard" />
      <Leaderboard />
      <JNSBar compact />
    </>
  );
}
