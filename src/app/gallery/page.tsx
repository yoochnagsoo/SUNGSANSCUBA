"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  ImageIcon,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";

type GalleryImage = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
};

type GalleryResponse = {
  ok: boolean;
  images?: GalleryImage[];
  message?: string;
};

function getCardAspectClass(index: number) {
  const pattern = index % 6;

  if (pattern === 0) {
    return "aspect-[4/5]";
  }

  if (pattern === 1) {
    return "aspect-[4/3]";
  }

  if (pattern === 2) {
    return "aspect-square";
  }

  if (pattern === 3) {
    return "aspect-[5/4]";
  }

  if (pattern === 4) {
    return "aspect-[3/4]";
  }

  return "aspect-[4/3]";
}

export default function GalleryPage() {
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  const selectedImage =
    selectedIndex !== null ? galleryImages[selectedIndex] : null;

  const totalPhotos = galleryImages.length;

  const hasImages = useMemo(() => totalPhotos > 0, [totalPhotos]);

  async function loadGalleryImages() {
    setIsLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/gallery", {
        cache: "no-store",
      });

      const data = (await response.json()) as GalleryResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.message ?? "갤러리 이미지를 불러오지 못했습니다.");
      }

      setGalleryImages(data.images ?? []);
    } catch (error) {
      console.error("Failed to load gallery images:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "갤러리 이미지를 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadGalleryImages();
  }, []);

  const goToPrevious = () => {
    setSelectedIndex((current) => {
      if (galleryImages.length === 0) {
        return null;
      }

      if (current === null) {
        return 0;
      }

      return current === 0 ? galleryImages.length - 1 : current - 1;
    });
  };

  const goToNext = () => {
    setSelectedIndex((current) => {
      if (galleryImages.length === 0) {
        return null;
      }

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
              {totalPhotos} Photos
            </div>

            <p className="hidden text-sm font-medium text-slate-400 sm:block">
              사진을 클릭하면 크게 볼 수 있습니다.
            </p>
          </div>

          {isLoading ? (
            <div className="flex min-h-[360px] items-center justify-center rounded-[2rem] border border-white/10 bg-white/[0.04] text-slate-300 backdrop-blur">
              <div className="flex items-center gap-3 text-sm font-bold">
                <Loader2 className="h-5 w-5 animate-spin text-cyan-300" />
                갤러리 이미지를 불러오는 중입니다.
              </div>
            </div>
          ) : message ? (
            <div className="flex min-h-[360px] items-center justify-center rounded-[2rem] border border-rose-300/20 bg-rose-500/10 px-6 text-center text-rose-100 backdrop-blur">
              <div>
                <ImageIcon className="mx-auto h-10 w-10" />
                <h2 className="mt-4 text-xl font-black">
                  갤러리를 불러오지 못했습니다
                </h2>
                <p className="mt-2 text-sm text-rose-100/80">{message}</p>
                <button
                  type="button"
                  onClick={loadGalleryImages}
                  className="mt-5 rounded-full bg-white px-5 py-2 text-sm font-black text-slate-950 transition hover:bg-cyan-100"
                >
                  다시 불러오기
                </button>
              </div>
            </div>
          ) : !hasImages ? (
            <div className="flex min-h-[360px] items-center justify-center rounded-[2rem] border border-white/10 bg-white/[0.04] px-6 text-center text-slate-300 backdrop-blur">
              <div>
                <ImageIcon className="mx-auto h-12 w-12 text-cyan-300" />
                <h2 className="mt-5 text-2xl font-black text-white">
                  아직 등록된 갤러리 이미지가 없습니다
                </h2>
                <p className="mt-3 text-sm text-slate-400">
                  관리자 페이지에서 갤러리 이미지를 등록하면 이곳에 표시됩니다.
                </p>
              </div>
            </div>
          ) : (
            <div className="columns-1 gap-5 pb-20 sm:columns-2 lg:columns-3 xl:columns-4">
              {galleryImages.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className="group mb-5 block w-full break-inside-avoid overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900 text-left shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-cyan-300/50"
                >
                  <div className={`relative ${getCardAspectClass(index)}`}>
                    <Image
                      src={image.imageUrl}
                      alt={image.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition duration-700 group-hover:scale-105"
                      unoptimized
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/10 to-transparent opacity-90 transition group-hover:opacity-100" />

                    <div className="absolute left-5 top-5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black text-white backdrop-blur">
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    <div className="absolute inset-x-0 bottom-0 translate-y-2 p-6 opacity-90 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                      <p className="text-xl font-black text-white">
                        {image.title}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm font-medium text-slate-300">
                        {image.description || "SUNG SAN SCUBA"}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
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
                src={selectedImage.imageUrl}
                alt={selectedImage.title}
                fill
                sizes="100vw"
                className="object-contain"
                priority
                unoptimized
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
                SUNG SAN SCUBA Gallery
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {selectedImage.description ||
                  "성산 바다에서 기록한 다이빙 순간입니다."}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}