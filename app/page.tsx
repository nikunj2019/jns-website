import Hero from "./components/home/Hero";
import ProblemCards from "./components/home/ProblemCards";
import CommandCenterSection from "./components/home/CommandCenterSection";
import SolutionPillars from "./components/home/SolutionPillars";
import BuildCapabilities from "./components/home/BuildCapabilities";
import ProcessStrip from "./components/home/ProcessStrip";
import TrustMetrics from "./components/home/TrustMetrics";
import FounderTrust from "./components/home/FounderTrust";
import FinalCTA from "./components/home/FinalCTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ProblemCards />
      <CommandCenterSection />
      <SolutionPillars />
      <BuildCapabilities />
      <ProcessStrip />
      <TrustMetrics />
      <FounderTrust />
      <FinalCTA />
    </>
  );
}
