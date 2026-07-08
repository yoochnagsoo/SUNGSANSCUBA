import Hero from "@/components/home/Hero";
import QuickReservationBar from "@/components/home/QuickReservationBar";
import AboutSection from "@/components/home/AboutSection";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import DiveDestinations from "@/components/home/DiveDestinations";
import PadiCourses from "@/components/home/PadiCourses";
import Gallery from "@/components/home/Gallery";
import Reviews from "@/components/home/Reviews";
import InstagramSection from "@/components/home/InstagramSection";
import FAQ from "@/components/home/FAQ";
import ReservationCTA from "@/components/home/ReservationCTA";
import Footer from "@/components/layout/Footer";

export default function Home() {
  return (
    <main>
      <Hero />
      <QuickReservationBar />
      <AboutSection />
      <WhyChooseUs />
      <DiveDestinations />
      <PadiCourses />
      <Gallery />
      <Reviews />
      <InstagramSection />
      <FAQ />
      <ReservationCTA />
      <Footer />
    </main>
  );
}