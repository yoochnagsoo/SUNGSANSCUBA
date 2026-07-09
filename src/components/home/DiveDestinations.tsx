"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Gauge,
  ImageIcon,
  Thermometer,
  Waves,
  X,
} from "lucide-react";

type DiveDestinationWaterTemperature = {
  season: string;
  months: string;
  temperature: string;
};

type DiveDestination = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrls: string[];
  depth: string;
  level: string;
  highlights: string[];
  waterTemperatures: DiveDestinationWaterTemperature[];
  sortOrder: number;
  isActive: boolean;
};

function normalizeWaterTemperatures(
  value: unknown
): DiveDestinationWaterTemperature[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const data = item as Record<string, unknown>;

      return {
        season: String(data.season ?? "").trim(),
        months: String(data.months ?? "").trim(),
        temperature: String(data.temperature ?? "").trim(),
      };
    })
    .filter(
      (item): item is DiveDestinationWaterTemperature =>
        !!item && !!item.season && !!item.temperature
    );
}

function normalizeDestination(item: Partial<DiveDestination>): DiveDestination {
  return {
    id: String(item.id ?? ""),
    title: String(item.title ?? ""),
    subtitle: String(item.subtitle ?? ""),
    description: String(item.description ?? ""),
    imageUrls: Array.isArray(item.imageUrls)
      ? item.imageUrls.map(String).filter(Boolean)
      : [],
    depth: String(item.depth ?? ""),
    level: String(item.level ?? ""),
    highlights: Array.isArray(item.highlights)
      ? item.highlights.map(String).filter(Boolean)
      : [],
    waterTemperatures: normalizeWaterTemperatures(item.waterTemperatures),
    sortOrder:
      typeof item.sortOrder === "number"
        ? item.sortOrder
        : Number(item.sortOrder ?? 0),
    isActive: item.isActive !== false,
  };
}

export default function DiveDestinations() {
  const [destinations, setDestinations] = useState<DiveDestination[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadDestinations() {
      try {
        const response = await fetch("/api/dive-destinations", {
          cache: "no-store",
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error("다이빙 포인트 API 오류");
        }

        const rawItems = Array.isArray(data?.destinations)
          ? data.destinations
          : Array.isArray(data)
            ? data
            : [];

        const items = rawItems.map(normalizeDestination);

        if (mounted) {
          setDestinations(items);
        }
      } catch (error) {
        console.error("[DiveDestinations]", error);

        if (mounted) {
          setDestinations([]);
        }
      } finally {
        if (mounted) {
          setIsLoaded(true);
        }
      }
    }

    loadDestinations();

    return () => {
      mounted = false;
    };
  }, []);

  const visibleDestinations = useMemo(() => {
    return [...destinations]
      .filter((item) => item.isActive !== false)
      .sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) {
          return a.sortOrder - b.sortOrder;
        }

        return a.title.localeCompare(b.title);
      });
  }, [destinations]);

  useEffect(() => {
    if (activeIndex >= visibleDestinations.length) {
      setActiveIndex(0);
      setImageIndex(0);
    }
  }, [activeIndex, visibleDestinations.length]);

  const activeDestination =
    visibleDestinations[activeIndex] ?? visibleDestinations[0];

  const activeImages =
    activeDestination?.imageUrls && activeDestination.imageUrls.length > 0
      ? activeDestination.imageUrls
      : [];

  const activeImageUrl = activeImages[imageIndex] ?? activeImages[0];

  const activeWaterTemperatures =
    activeDestination?.waterTemperatures &&
    activeDestination.waterTemperatures.length > 0
      ? activeDestination.waterTemperatures
      : [];

  function selectDestination(index: number) {
    setActiveIndex(index);
    setImageIndex(0);
  }

  function moveImage(direction: "prev" | "next") {
    if (activeImages.length <= 1) {
      return;
    }

    setImageIndex((current) => {
      if (direction === "prev") {
        return (current - 1 + activeImages.length) % activeImages.length;
      }

      return (current + 1) % activeImages.length;
    });
  }

  function openPreview(imageUrl: string) {
    setPreviewImageUrl(imageUrl);
  }

  function closePreview() {
    setPreviewImageUrl(null);
  }

  if (!isLoaded) {
    return null;
  }

  if (visibleDestinations.length === 0 || !activeDestination) {
    return null;
  }

  return (
    <>
      <section className="relative overflow-hidden bg-white py-24 sm:py-28">
        <div className="absolute inset-x-0 bottom-0 h-px bg-slate-100" />

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-black uppercase tracking-[0.55em] text-sky-500">
              Jeju Dive Destinations
            </p>

            <h2 className="mt-5 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              제주 성산의 대표 다이빙 포인트
            </h2>

            <p className="mt-6 text-base font-medium text-slate-500 sm:text-lg">
              SUNGSAN SCUBA가 안내하는 제주 동부권의 아름다운 바다를 만나보세요.
            </p>
          </div>

          <div className="mt-12 flex flex-wrap justify-center gap-3">
            {visibleDestinations.map((destination, index) => {
              const active = index === activeIndex;

              return (
                <button
                  key={destination.id}
                  type="button"
                  onClick={() => selectDestination(index)}
                  className={[
                    "rounded-full px-6 py-3 text-sm font-black shadow-sm transition",
                    active
                      ? "bg-slate-950 text-white shadow-xl shadow-slate-950/15"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-950",
                  ].join(" ")}
                >
                  {destination.title}
                </button>
              );
            })}
          </div>

          <div className="mt-10 overflow-hidden rounded-[2rem] bg-slate-950 shadow-2xl shadow-slate-950/15 lg:rounded-[2.5rem]">
            <div className="grid min-h-[560px] lg:grid-cols-2">
              <div className="relative min-h-[360px] overflow-hidden bg-slate-200 lg:min-h-[560px]">
                {activeImageUrl ? (
                  <button
                    type="button"
                    onClick={() => openPreview(activeImageUrl)}
                    className="group absolute inset-0"
                    aria-label={`${activeDestination.title} 이미지 크게 보기`}
                  >
                    <Image
                      src={activeImageUrl}
                      alt={activeDestination.title}
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover transition duration-700 group-hover:scale-105"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/25 via-transparent to-transparent" />

                    <div className="absolute bottom-5 left-5 rounded-full bg-slate-950/55 px-4 py-2 text-xs font-black text-white opacity-0 backdrop-blur transition group-hover:opacity-100">
                      이미지 크게 보기
                    </div>
                  </button>
                ) : (
                  <div className="flex h-full min-h-[360px] items-center justify-center bg-slate-200 lg:min-h-[560px]">
                    <div className="text-center text-slate-500">
                      <ImageIcon className="mx-auto h-12 w-12" />
                      <p className="mt-3 text-sm font-bold">
                        등록된 이미지가 없습니다
                      </p>
                    </div>
                  </div>
                )}

                {activeImages.length > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => moveImage("prev")}
                      className="absolute left-5 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
                      aria-label="이전 이미지"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>

                    <button
                      type="button"
                      onClick={() => moveImage("next")}
                      className="absolute right-5 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25"
                      aria-label="다음 이미지"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>

                    <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2 rounded-full bg-slate-950/40 px-3 py-2 backdrop-blur">
                      {activeImages.map((imageUrl, index) => (
                        <button
                          key={`${imageUrl}-${index}`}
                          type="button"
                          onClick={() => setImageIndex(index)}
                          className={[
                            "h-2.5 rounded-full transition",
                            index === imageIndex
                              ? "w-8 bg-white"
                              : "w-2.5 bg-white/50 hover:bg-white/80",
                          ].join(" ")}
                          aria-label={`${index + 1}번째 이미지 보기`}
                        />
                      ))}
                    </div>
                  </>
                ) : null}
              </div>

              <div className="flex items-center bg-slate-950 px-8 py-10 text-white sm:px-12 lg:px-14">
                <div className="w-full">
                  {activeDestination.subtitle ? (
                    <p className="text-sm font-black uppercase tracking-[0.55em] text-cyan-300">
                      {activeDestination.subtitle}
                    </p>
                  ) : null}

                  <h3 className="mt-5 text-5xl font-black tracking-tight text-white">
                    {activeDestination.title}
                  </h3>

                  {activeDestination.level ? (
                    <div className="mt-6 inline-flex max-w-full items-center gap-3 rounded-full bg-white/10 px-5 py-3">
                      <Gauge className="h-5 w-5 shrink-0 text-cyan-300" />
                      <span className="shrink-0 text-sm font-medium text-slate-400">
                        난이도
                      </span>
                      <span className="text-sm font-black text-white">
                        {activeDestination.level}
                      </span>
                    </div>
                  ) : null}

                  {activeDestination.description ? (
                    <p className="mt-7 max-w-xl text-base font-semibold leading-8 text-slate-100 sm:text-lg">
                      {activeDestination.description}
                    </p>
                  ) : null}

                  <div className="mt-8 grid gap-3">
                    {activeDestination.depth ? (
                      <div className="rounded-2xl bg-white/10 p-4">
                        <div className="flex items-center gap-3">
                          <Waves className="h-5 w-5 shrink-0 text-cyan-300" />
                          <p className="text-sm font-medium text-slate-400">
                            수심
                          </p>
                          <p className="ml-auto text-sm font-black text-white">
                            {activeDestination.depth}
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {activeWaterTemperatures.length > 0 ? (
                      <div className="rounded-2xl bg-white/10 p-4">
                        <div className="mb-3 flex items-center gap-3">
                          <Thermometer className="h-5 w-5 shrink-0 text-cyan-300" />
                          <p className="text-sm font-medium text-slate-400">
                            계절별 수온
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {activeWaterTemperatures.map((item, index) => (
                            <div
                              key={`${item.season}-${index}`}
                              className="rounded-xl bg-slate-950/35 px-3 py-2 text-center ring-1 ring-white/5"
                            >
                              <p className="text-xs font-black text-white">
                                {item.season}
                              </p>
                              {item.months ? (
                                <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                                  {item.months}
                                </p>
                              ) : null}
                              <p className="mt-1 text-xs font-black text-cyan-200">
                                {item.temperature}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {activeDestination.highlights.length > 0 ? (
                    <div className="mt-8">
                      <p className="text-sm font-black uppercase tracking-[0.35em] text-slate-400">
                        Highlights
                      </p>

                      <div className="mt-4 flex flex-wrap gap-3">
                        {activeDestination.highlights.map((highlight) => (
                          <span
                            key={highlight}
                            className="inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-black text-white"
                          >
                            {highlight}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {activeImages.length > 1 ? (
            <div className="mt-5 flex justify-center gap-3 overflow-x-auto pb-2">
              {activeImages.map((imageUrl, index) => (
                <button
                  key={`${imageUrl}-thumbnail-${index}`}
                  type="button"
                  onClick={() => {
                    setImageIndex(index);
                    openPreview(imageUrl);
                  }}
                  className={[
                    "relative h-20 w-28 shrink-0 overflow-hidden rounded-2xl bg-slate-200 ring-2 transition hover:scale-105",
                    index === imageIndex
                      ? "ring-cyan-400"
                      : "ring-transparent hover:ring-slate-300",
                  ].join(" ")}
                >
                  <Image
                    src={imageUrl}
                    alt={`${activeDestination.title} 썸네일 ${index + 1}`}
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {previewImageUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4"
          onClick={closePreview}
        >
          <button
            type="button"
            onClick={closePreview}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-3 text-white backdrop-blur transition hover:bg-white/20"
            aria-label="이미지 크게 보기 닫기"
          >
            <X className="h-6 w-6" />
          </button>

          {activeImages.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  moveImage("prev");
                  const nextIndex =
                    (imageIndex - 1 + activeImages.length) %
                    activeImages.length;
                  setPreviewImageUrl(activeImages[nextIndex]);
                }}
                className="absolute left-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
                aria-label="이전 확대 이미지"
              >
                <ChevronLeft className="h-7 w-7" />
              </button>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  moveImage("next");
                  const nextIndex = (imageIndex + 1) % activeImages.length;
                  setPreviewImageUrl(activeImages[nextIndex]);
                }}
                className="absolute right-4 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
                aria-label="다음 확대 이미지"
              >
                <ChevronRight className="h-7 w-7" />
              </button>
            </>
          ) : null}

          <div
            className="relative h-[82vh] w-full max-w-6xl overflow-hidden rounded-3xl bg-slate-900"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={previewImageUrl}
              alt={`${activeDestination.title} 확대 이미지`}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>

          {activeImages.length > 1 ? (
            <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur">
              {activeImages.map((imageUrl, index) => (
                <button
                  key={`${imageUrl}-preview-dot-${index}`}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setImageIndex(index);
                    setPreviewImageUrl(imageUrl);
                  }}
                  className={[
                    "h-2.5 rounded-full transition",
                    index === imageIndex
                      ? "w-8 bg-white"
                      : "w-2.5 bg-white/45 hover:bg-white/80",
                  ].join(" ")}
                  aria-label={`${index + 1}번째 확대 이미지 보기`}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}