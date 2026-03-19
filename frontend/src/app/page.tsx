import Hero from "@/components/Hero";
import QuickServices from "@/components/QuickServices";
import StatsDashboard from "@/components/StatsDashboard";
import ComplaintSection from "@/components/ComplaintSection";
import ConsumerTools from "@/components/ConsumerTools";
import NewsSection from "@/components/NewsSection";
import Chatbot from "@/components/Chatbot";

export default function Home() {
  return (
    <>
      <Hero />
      <QuickServices />
      <StatsDashboard />
      <ComplaintSection />
      <ConsumerTools />
      <NewsSection />
      <Chatbot />
    </>
  );
}
