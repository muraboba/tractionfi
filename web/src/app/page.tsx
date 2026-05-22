import Demo from "./_landing/demo";
import FAQ from "./_landing/faq";
import Footer from "./_landing/footer";
import Framework from "./_landing/framework";
import Hero from "./_landing/hero";
import HowItWorks from "./_landing/how-it-works";
import PriorityPreview from "./_landing/priority-preview";
import TopBar from "./_landing/topbar";

export default function HomePage() {
  return (
    <>
      <TopBar />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <Framework />
        <PriorityPreview />
        <Demo />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
