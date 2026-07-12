import Hero from "@/components/home/Hero";
import AboutSection from "@/components/home/AboutSection";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import DiveDestinations from "@/components/home/DiveDestinations";
import PadiCourses from "@/components/home/PadiCourses";
import Gallery from "@/components/home/Gallery";
import Reviews from "@/components/home/Reviews";

import FAQ from "@/components/home/FAQ";
import ReservationCTA from "@/components/home/ReservationCTA";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Hero />

      <section id="about" className="scroll-mt-24">
        <AboutSection />
      </section>

      <section id="why" className="scroll-mt-24">
        <WhyChooseUs />
      </section>

      <section id="destinations" className="scroll-mt-24">
        <DiveDestinations />
      </section>

      <section id="courses" className="scroll-mt-24">
        <PadiCourses />
      </section>

      <section id="gallery" className="scroll-mt-24">
        <Gallery />
      </section>

      <section id="reviews" className="scroll-mt-24">
        <Reviews />
      </section>

    

      <section id="faq" className="scroll-mt-24">
        <FAQ />
      </section>

      <section id="reservation" className="scroll-mt-24">
        <ReservationCTA />
      </section>

      <section id="location" className="scroll-mt-24">
        <Footer />
      </section>
    </main>
  );
}
