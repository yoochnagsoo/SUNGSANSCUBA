import Hero from "@/components/home/Hero";
import AboutSection from "@/components/home/AboutSection";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import DiveDestinations from "@/components/home/DiveDestinations";

export default function Home() {
  return (
    <main>
      <Hero />
       <AboutSection />
       <WhyChooseUs />
       <DiveDestinations />
    </main>
  );
}