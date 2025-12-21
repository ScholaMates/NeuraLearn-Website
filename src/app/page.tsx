import Hero from "@/components/Hero";
import Features from "@/components/Features";
import VideoSection from "@/components/VideoSection";
import FAQ from "@/components/FAQ";

export default function Home() {
  return (
    <main className="min-h-screen bg-mocha-base text-mocha-text selection:bg-mocha-pink selection:text-mocha-base font-space">
      <Hero />
      <Features />
      <VideoSection />
      <FAQ />


    </main>
  );
}
