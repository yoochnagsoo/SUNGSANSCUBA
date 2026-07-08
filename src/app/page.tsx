import Hero from "@/components/home/Hero";
import AboutSection from "@/components/home/AboutSection";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import DiveDestinations from "@/components/home/DiveDestinations";
import PadiCourses from "@/components/home/PadiCourses";
import Gallery from "@/components/home/Gallery";
import Reviews from "@/components/home/Reviews";

export default function Home() {
  return (
    <main>
      <Hero />
       <AboutSection />
       <WhyChooseUs />
       <DiveDestinations />
       <PadiCourses />
       <Gallery />
       <Reviews />
    </main>
  );
}