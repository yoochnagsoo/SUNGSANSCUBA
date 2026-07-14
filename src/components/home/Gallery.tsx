"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Camera, ImageIcon, Loader2, Sparkles } from "lucide-react";

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
    return "aspect-[16/9]";
  }

  if (pattern === 4) {
    return "aspect-[4/3]";
  }

  return "aspect-[5/4]";
}

export default function Gallery() {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");

  const previewImages = useMemo(() => images.slice(0, 9), [images]);

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

      setImages(data.images ?? []);
    } catch (error) {
      console.error("Failed to load gallery preview images:", error);

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

  return (
    <div className="relative overflow-hidden bg-slate-950 px-6 py-24 text-white sm:px-8 lg:px-16">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(14,165,233,0.22),transparent_32%),radial-gradient(circle_at_85%_70%,rgba(34,211,238,0.16),transparent_30%)]" />
      <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-100 backdrop-blur">
              <Sparkles className="h-4 w-4" />
              Gallery
            </div>

            <h2 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
              성산 바다의 순간들
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
              체험다이빙, 수중 포토, 제주 성산 앞바다의 생생한 장면들을
              갤러리에서 확인해보세요.
            </p>
          </div>

          <Link
            href="/gallery"
            className="inline-flex w-fit items-center gap-2 rounded-full bg-cyan-400 px-6 py-3 text-sm font-black text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-300"
          >
            전체 갤러리 보기
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-[2rem] border border-white/10 bg-white/[0.04] text-slate-300 backdrop-blur">
            <div className="inline-flex items-center gap-3 text-sm font-bold">
              <Loader2 className="h-5 w-5 animate-spin text-cyan-300" />
              갤러리 이미지를 불러오는 중입니다.
            </div>
          </div>
        ) : message ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-[2rem] border border-white/10 bg-white/[0.04] px-6 text-center text-slate-300 backdrop-blur">
            <div>
              <ImageIcon className="mx-auto h-10 w-10 text-cyan-300" />
              <h3 className="mt-4 text-xl font-black text-white">
                갤러리를 불러오지 못했습니다
              </h3>
              <p className="mt-2 text-sm text-slate-400">{message}</p>
              <button
                type="button"
                onClick={loadGalleryImages}
                className="mt-5 rounded-full bg-white px-5 py-2 text-sm font-black text-slate-950 transition hover:bg-cyan-100"
              >
                다시 불러오기
              </button>
            </div>
          </div>
        ) : previewImages.length === 0 ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-[2rem] border border-white/10 bg-white/[0.04] px-6 text-center text-slate-300 backdrop-blur">
            <div>
              <Camera className="mx-auto h-12 w-12 text-cyan-300" />
              <h3 className="mt-5 text-2xl font-black text-white">
                아직 등록된 갤러리 이미지가 없습니다
              </h3>
              <p className="mt-3 text-sm text-slate-400">
                관리자 페이지에서 이미지를 등록하면 메인에 자동으로 표시됩니다.
              </p>
            </div>
          </div>
        ) : (
          <div className="columns-1 gap-5 sm:columns-2 lg:columns-3">
            {previewImages.map((image, index) => (
              <Link
                key={image.id}
                href="/gallery"
                className="group mb-5 block w-full break-inside-avoid overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900 shadow-xl shadow-black/20 transition hover:-translate-y-1 hover:border-cyan-300/50"
              >
                <div className={`relative ${getCardAspectClass(index)}`}>
                  <Image
                    src={image.imageUrl}
                    alt={image.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition duration-700 group-hover:scale-105"
                    unoptimized
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/10 to-transparent opacity-90 transition group-hover:opacity-100" />

                  <div className="absolute left-5 top-5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black text-white backdrop-blur">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <p className="line-clamp-1 text-lg font-black text-white">
                      {image.title}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">
                      {image.description || "SEONG SAN SCUBA Gallery"}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}