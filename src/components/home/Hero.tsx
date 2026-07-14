"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Camera,
  HelpCircle,
  MapPin,
  MessageCircle,
  Waves,
} from "lucide-react";
import { siteConfig } from "@/data/site";

const navItems = [
  {
    label: "About",
    target: "about",
  },
  {
    label: "Dive Sites",
    target: "destinations",
  },
  {
    label: "PADI",
    target: "courses",
  },
  {
    label: "Gallery",
    target: "gallery",
  },
  {
    label: "Reviews",
    target: "reviews",
  },
  {
    label: "FAQ",
    target: "faq",
  },
];

export default function Hero() {
  const router = useRouter();

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);

    if (!section) {
      return;
    }

    section.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <section className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <Image
        src="/images/hero/hero-04.jpg"
        alt={siteConfig.fullName}
        fill
        priority
        className="object-cover"
      />

      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/65 to-slate-950/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-slate-950/30" />

      <header className="relative z-20 flex h-24 items-center justify-between px-6 sm:px-8 lg:px-16">
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="text-left leading-none"
        >
          <div className="text-2xl font-black tracking-[0.16em] text-white">
            SEONG SAN
          </div>
          <div className="mt-1 text-xs font-bold tracking-[0.34em] text-cyan-300">
            SCUBA
          </div>
        </button>

        <nav className="hidden items-center gap-6 text-xs font-black uppercase tracking-[0.16em] text-white/80 xl:flex">
          {navItems.map((item) => (
            <button
              key={item.target}
              type="button"
              onClick={() => scrollToSection(item.target)}
              className="transition hover:text-cyan-300"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => scrollToSection("reservation")}
            className="hidden rounded-full border border-white/20 bg-white/10 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/15 md:inline-flex"
          >
            Contact
          </button>

          <button
            type="button"
            onClick={() => router.push("/reservation")}
            className="rounded-full bg-cyan-400 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-950 shadow-lg shadow-cyan-500/30 transition hover:bg-cyan-300"
          >
            Reserve
          </button>
        </div>
      </header>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-96px)] max-w-6xl items-center px-6 pb-24 pt-8 sm:px-8 lg:px-0">
        <div className="max-w-3xl">
          <div className="mb-8 inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-5 py-2 text-xs font-black uppercase tracking-[0.35em] text-cyan-100 shadow-lg shadow-cyan-950/30 backdrop-blur">
            Jeju Island, Korea
          </div>

          <h1 className="text-6xl font-black uppercase leading-[0.88] tracking-tight text-white sm:text-7xl md:text-8xl lg:text-[8.5rem]">
            SEONG SAN
            <br />
            SCUBA
          </h1>

          <p className="mt-6 text-3xl font-light italic tracking-tight text-cyan-200 sm:text-4xl md:text-5xl">
            Dive Beyond Limits
          </p>

          <p className="mt-8 max-w-2xl text-base font-medium leading-8 text-slate-100 sm:text-lg">
            제주 성산의 아름다운 바다에서 체험다이빙, PADI 교육, 펀다이빙을
            경험하세요. 처음 다이빙하는 분들도 안전하게 즐길 수 있도록 강사
            배정 기준에 맞춰 운영합니다.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <button
              type="button"
              onClick={() => router.push("/reservation")}
              className="inline-flex h-16 items-center justify-center gap-3 rounded-full bg-cyan-400 px-8 text-sm font-black uppercase tracking-[0.22em] text-slate-950 shadow-xl shadow-cyan-500/25 transition hover:-translate-y-0.5 hover:bg-cyan-300"
            >
              Book Your Dive
              <ArrowRight className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => scrollToSection("courses")}
              className="inline-flex h-16 items-center justify-center gap-3 rounded-full border border-white/20 bg-white/10 px-8 text-sm font-black uppercase tracking-[0.22em] text-white shadow-xl shadow-slate-950/20 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15"
            >
              View Programs
              <BookOpen className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-12 grid max-w-3xl gap-4 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => router.push("/discover-scuba")}
              className="rounded-3xl border border-white/15 bg-white/10 p-5 text-left backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15"
            >
              <Waves className="mb-4 h-6 w-6 text-cyan-300" />
              <p className="text-base font-black text-white">체험 다이빙</p>
              <p className="mt-2 text-sm font-semibold text-slate-300">
                성산 바다에서 즐기는 안전한 체험
              </p>
            </button>

            <button
              type="button"
              onClick={() => scrollToSection("courses")}
              className="rounded-3xl border border-white/15 bg-white/10 p-5 text-left backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15"
            >
              <BookOpen className="mb-4 h-6 w-6 text-cyan-300" />
              <p className="text-base font-black text-white">PADI Courses</p>
              <p className="mt-2 text-sm font-semibold text-slate-300">
                오픈워터부터 체계적인 교육
              </p>
            </button>

            <button
              type="button"
              onClick={() => scrollToSection("gallery")}
              className="rounded-3xl border border-white/15 bg-white/10 p-5 text-left backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15"
            >
              <Camera className="mb-4 h-6 w-6 text-cyan-300" />
              <p className="text-base font-black text-white">Gallery</p>
              <p className="mt-2 text-sm font-semibold text-slate-300">
                성산 바다의 순간을 확인하세요
              </p>
            </button>
          </div>

          <div className="mt-8 flex flex-wrap gap-3 text-sm font-bold text-white/80">
            <button
              type="button"
              onClick={() => scrollToSection("reviews")}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur transition hover:bg-white/15"
            >
              <MessageCircle className="h-4 w-4 text-cyan-300" />
              Reviews
            </button>

            <button
              type="button"
              onClick={() => scrollToSection("faq")}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur transition hover:bg-white/15"
            >
              <HelpCircle className="h-4 w-4 text-cyan-300" />
              FAQ
            </button>

            <button
              type="button"
              onClick={() => scrollToSection("location")}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur transition hover:bg-white/15"
            >
              <MapPin className="h-4 w-4 text-cyan-300" />
              Location
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 right-6 z-20 hidden rounded-full border border-white/15 bg-white/10 px-5 py-3 text-xs font-black text-white/80 shadow-xl shadow-slate-950/30 backdrop-blur lg:block">
        <span className="mr-2 text-cyan-300">≋</span>
        Jeju Seongsan Ocean Experience
      </div>
    </section>
  );
}
