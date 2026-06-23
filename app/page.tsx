import Hero from "./components/home/Hero";
import ProblemCards from "./components/home/ProblemCards";
import ServiceCards from "./components/home/ServiceCards";
import WorkShowcase from "./components/home/WorkShowcase";
import AICalling from "./components/home/AICalling";
import ProcessStrip from "./components/home/ProcessStrip";
import TrustMetrics from "./components/home/TrustMetrics";
import FounderTrust from "./components/home/FounderTrust";
import FinalCTA from "./components/home/FinalCTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ProblemCards />
      <ServiceCards />
      <WorkShowcase />
      <AICalling />
      <ProcessStrip />
      <TrustMetrics />
      <FounderTrust />
      <FinalCTA />
    </>
  );
}
