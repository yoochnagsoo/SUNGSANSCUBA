import Hero from "@/components/home/Hero";
import AboutSection from "@/components/home/AboutSection";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import DiveDestinations from "@/components/home/DiveDestinations";
import PadiCourses from "@/components/home/PadiCourses";
import Gallery from "@/components/home/Gallery";
import Reviews from "@/components/home/Reviews";
import ReservationCTA from "@/components/home/ReservationCTA";
import InstagramSection from "@/components/home/InstagramSection";
import QuickReservationBar from "@/components/home/QuickReservationBar";

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
       <ReservationCTA />
    </main>
  );
}