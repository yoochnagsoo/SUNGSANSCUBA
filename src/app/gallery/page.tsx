"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  Sparkles,
  X,
} from "lucide-react";

const galleryImages = [
  {
    src: "/images/gallery/gallery-01.jpg",
    title: "Seongsan Ocean",
    subtitle: "제주 성산 앞바다",
    description: "맑은 물빛과 화산섬의 지형이 만나는 성산의 바다.",
  },
  {
    src: "/images/gallery/gallery-02.jpg",
    title: "Discover Scuba",
    subtitle: "처음 만나는 수중 세계",
    description: "처음 다이빙하는 순간에도 편안하게 즐길 수 있는 수중 경험.",
  },
  {
    src: "/images/gallery/gallery-03.jpg",
    title: "Blue Moment",
    subtitle: "깊고 푸른 순간",
    description: "수면 아래에서만 만날 수 있는 고요하고 선명한 푸른빛.",
  },
  {
    src: "/images/gallery/gallery-04.jpg",
    title: "Marine Life",
    subtitle: "제주 바다의 생명들",
    description: "자리돔, 돌돔, 문어와 함께하는 제주 동쪽 바다의 생태.",
  },
  {
    src: "/images/gallery/gallery-05.jpg",
    title: "Dive Point",
    subtitle: "성산 다이빙 포인트",
    description: "초보 체험부터 펀다이빙까지 이어지는 성산권 포인트.",
  },
  {
    src: "/images/gallery/gallery-06.jpg",
    title: "Underwater Silence",
    subtitle: "물속의 고요함",
    description: "숨소리와 물결만 남는 수중에서의 특별한 시간.",
  },
  {
    src: "/images/gallery/gallery-07.jpg",
    title: "Ocean Light",
    subtitle: "수면 아래로 번지는 빛",
    description: "수면을 통과한 햇빛이 물속에 부드럽게 번지는 순간.",
  },
  {
    src: "/images/gallery/gallery-08.jpg",
    title: "Dive Buddy",
    subtitle: "함께하는 다이빙",
    description: "바다 안에서 함께 움직이는 버디와의 안정적인 호흡.",
  },
  {
    src: "/images/gallery/gallery-09.jpg",
    title: "Coral Scene",
    subtitle: "제주 바다의 색감",
    description: "성산 바다에서 마주하는 바위 지형과 수중 생물들.",
  },
  {
    src: "/images/gallery/gallery-10.jpg",
    title: "Training Day",
    subtitle: "안전한 교육 과정",
    description: "기초부터 차근차근 진행하는 다이빙 교육의 현장.",
  },
  {
    src: "/images/gallery/gallery-11.jpg",
    title: "Blue Dive",
    subtitle: "깊어지는 푸른 순간",
    description: "한 걸음 더 깊어질수록 선명해지는 수중의 색.",
  },
  {
    src: "/images/gallery/gallery-12.jpg",
    title: "Seongsan Point",
    subtitle: "성산 다이빙 포인트",
    description: "성산 앞바다에서 만나는 다양한 다이빙 포인트.",
  },
];

export default function GalleryPage() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const selectedImage =
    selectedIndex !== null ? galleryImages[selectedIndex] : null;

  const goToPrevious = () => {
    setSelectedIndex((current) => {
      if (current === null) {
        return 0;
      }

      return current === 0 ? galleryImages.length - 1 : current - 1;
    });
  };

  const goToNext = () => {
    setSelectedIndex((current) => {
      if (current === null) {
        return 0;
      }

      return current === galleryImages.length - 1 ? 0 : current + 1;
    });
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(14,165,233,0.24),transparent_32%),radial-gradient(circle_at_85%_20%,rgba(59,130,246,0.18),transparent_30%),linear-gradient(180deg,#020617_0%,#0f172a_50%,#020617_100%)]" />
        <div className="absolute left-1/2 top-28 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute -bottom-32 right-10 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <header className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-black/20 backdrop-blur transition hover:bg-white hover:text-slate-950"
            >
              <ArrowLeft className="h-4 w-4" />
              메인으로
            </Link>

            <div className="hidden items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-100 backdrop-blur sm:inline-flex">
              <Sparkles className="h-4 w-4" />
              SUNG SAN SCUBA Gallery
            </div>
          </header>

          <div className="py-20 text-center lg:py-24">
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.35em] text-cyan-200 shadow-lg shadow-cyan-950/20 backdrop-blur">
              <Camera className="h-4 w-4" />
              Full Gallery
            </p>

            <h1 className="mt-6 text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-8xl">
              Dive Moments
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              성산 바다에서 기록한 수중의 빛, 물결, 다이버의 순간들을 한곳에
              모았습니다.
            </p>
          </div>

          <div className="mb-8 flex items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur">
              <Grid3X3 className="h-4 w-4 text-cyan-300" />
              {galleryImages.length} Photos
            </div>

            <p className="hidden text-sm font-medium text-slate-400 sm:block">
              사진을 클릭하면 크게 볼 수 있습니다.
            </p>
          </div>

          <div className="grid auto-rows-[260px] gap-4 pb-20 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:auto-rows-[280px]">
            {galleryImages.map((image, index) => (
              <button
                key={image.src}
                type="button"
                onClick={() => setSelectedIndex(index)}
                className={`group relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900 text-left shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-cyan-300/50 ${
                  index === 0 || index === 7
                    ? "sm:col-span-2 sm:row-span-2"
                    : ""
                } ${index === 4 ? "md:col-span-2" : ""}`}
              >
                <Image
                  src={image.src}
                  alt={image.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover transition duration-700 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/10 to-transparent opacity-90 transition group-hover:opacity-100" />

                <div className="absolute left-5 top-5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black text-white backdrop-blur">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <div className="absolute inset-x-0 bottom-0 translate-y-2 p-6 opacity-90 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  <p className="text-xl font-black text-white">
                    {image.title}
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-300">
                    {image.subtitle}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {selectedImage && selectedIndex !== null ? (
        <div className="fixed inset-0 z-50 bg-slate-950/95 px-4 py-6 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="mx-auto flex h-full max-w-7xl flex-col">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.3em] text-cyan-300">
                  {String(selectedIndex + 1).padStart(2, "0")} /{" "}
                  {String(galleryImages.length).padStart(2, "0")}
                </p>
                <h2 className="mt-1 text-2xl font-black text-white">
                  {selectedImage.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedIndex(null)}
                className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white hover:text-slate-950"
                aria-label="갤러리 닫기"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative min-h-0 flex-1 overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900 shadow-2xl shadow-black/40">
              <Image
                src={selectedImage.src}
                alt={selectedImage.title}
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />

              <button
                type="button"
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur transition hover:bg-white hover:text-slate-950"
                aria-label="이전 이미지"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>

              <button
                type="button"
                onClick={goToNext}
                className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white backdrop-blur transition hover:bg-white hover:text-slate-950"
                aria-label="다음 이미지"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>

            <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/10 p-5 backdrop-blur">
              <p className="text-sm font-bold text-cyan-200">
                {selectedImage.subtitle}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {selectedImage.description}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}