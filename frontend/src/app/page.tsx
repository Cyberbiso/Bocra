import Hero from "@/components/Hero";
import QuickServices from "@/components/QuickServices";
import StatsDashboard from "@/components/StatsDashboard";
import ComplaintSection from "@/components/ComplaintSection";
import ConsumerTools from "@/components/ConsumerTools";
import NewsSection from "@/components/NewsSection";

export default function Home() {
  return (
    <>
      <Hero />
      <QuickServices />
      <StatsDashboard />
      <ComplaintSection />
      <ConsumerTools />
      <NewsSection />
    </>
  );
}
