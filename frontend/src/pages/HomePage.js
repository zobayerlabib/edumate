import React from "react";

import HeroSection from "../sections/HeroSection";
import AboutSection from "../sections/AboutSection";
import FeaturesSection from "../sections/FeaturesSection";
import HowItWorksSection from "../sections/HowItWorksSection";
import StatsSection from "../sections/StatsSection";
import CallToAction from "../sections/CallToAction";

function HomePage() {
  return (
    <>
      <HeroSection />
      <AboutSection />
      <FeaturesSection />
      <HowItWorksSection />
      <StatsSection />
      <CallToAction />
    </>
  );
}

export default HomePage;
