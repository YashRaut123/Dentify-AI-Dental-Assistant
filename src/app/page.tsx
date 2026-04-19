import Hero from "@/components/ui/landing/Hero";
import Header from "@/components/ui/landing/Header";
import HowItWorks from "@/components/ui/landing/HowItWorks";
import WhatToAsk from "@/components/ui/landing/WhatToAsk";
import PricingSection from "@/components/ui/landing/PricingSection";
import CTA from "@/components/ui/landing/CTA";
import Footer from "@/components/ui/landing/Footer";
import { currentUser } from "@clerk/nextjs/server";
import { syncUser } from "@/lib/actions/users";
import { redirect } from "next/navigation";





export default async function Home() {
  const user = await currentUser();

  await syncUser();

  if (user) redirect("/dashboard");
  return (
    <div>
      <Header />
      <Hero />
      <HowItWorks />
      <WhatToAsk />
      <PricingSection />
      <CTA />
      <Footer />
    </div>
  );
}
