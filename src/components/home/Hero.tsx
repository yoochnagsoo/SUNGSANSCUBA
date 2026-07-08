import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { siteConfig } from "@/data/site";

export default function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <Image
        src="/images/hero/hero-01.jpg"
        alt={siteConfig.fullName}
        fill
        priority
        className="object-cover"
      />

      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/55 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/20" />

      <header className="relative z-20 flex h-24 items-center justify-between px-8 lg:px-16">
        <div className="leading-none">
          <div className="text-2xl font-black tracking-[0.16em]">SUNGSAN</div>
          <div className="text-2xl font-black tracking-[0.22em]">SCUBA</div>
          <div className="mt-1 text-[10px] tracking-[0.45em] text-white/70">
            DIVE CENTER
          </div>
        </div>

        <nav className="hidden gap-10 text-sm font-semibold tracking-[0.15em] lg:flex">
          <a href="/about">ABOUT</a>
          <a href="/destinations">DIVE SITES</a>
          <a href="/courses">COURSES</a>
          <a href="/gallery">GALLERY</a>
          <a href="/reservation">RESERVATION</a>
        </nav>
      </header>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-96px)] max-w-7xl items-center px-8 lg:px-16">
        <div className="max-w-3xl">
          <p className="mb-6 tracking-[0.5em] text-sky-300">
            JEJU ISLAND, KOREA
          </p>

          <h1 className="text-6xl font-black leading-[0.92] md:text-8xl lg:text-9xl">
            SUNGSAN
            <br />
            SCUBA
          </h1>

          <p className="mt-5 text-3xl font-light italic text-sky-300 md:text-5xl">
            {siteConfig.slogan}
          </p>

          <p className="mt-10 max-w-xl text-lg leading-8 text-white/85">
            제주 성산의 아름다운 바다에서 체험다이빙, PADI 교육, 펀다이빙을
            경험하세요.
          </p>

          <a
            href="/reservation"
            className="mt-9 inline-flex items-center gap-4 rounded-full bg-sky-400 px-9 py-4 font-bold tracking-[0.12em] text-slate-950 transition hover:bg-white"
          >
            BOOK YOUR DIVE
            <ArrowRight size={20} />
          </a>
        </div>
      </div>
    </section>
  );
}