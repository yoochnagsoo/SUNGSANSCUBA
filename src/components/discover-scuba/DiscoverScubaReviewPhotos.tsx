"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { reviewItems } from "@/data/reviews";

type Review = {
  id: string;
  userId: string;
  program: string;
  comment: string;
  images: string[];
};

type ReviewViewerState = Review & {
  currentIndex: number;
};

const FALLBACK_REVIEWS = reviewItems.filter((review) =>
  review.program.includes("체험"),
);

const INITIAL_REVIEW_COUNT = 8;
const REVIEW_COUNT_STEP = 8;

function ReviewViewer({
  viewer,
  onClose,
  onChangeIndex,
}: {
  viewer: ReviewViewerState;
  onClose: () => void;
  onChangeIndex: (nextIndex: number) => void;
}) {
  const currentImage = viewer.images[viewer.currentIndex];

  function goPrevious() {
    if (viewer.images.length <= 1) {
      return;
    }

    if (viewer.currentIndex === 0) {
      onChangeIndex(viewer.images.length - 1);
      return;
    }

    onChangeIndex(viewer.currentIndex - 1);
  }

  function goNext() {
    if (viewer.images.length <= 1) {
      return;
    }

    onChangeIndex((viewer.currentIndex + 1) % viewer.images.length);
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }

      if (event.key === "ArrowLeft") {
        goPrevious();
      }

      if (event.key === "ArrowRight") {
        goNext();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  });

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 px-4 py-6 text-white backdrop-blur-md">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="후기 상세 닫기"
        onClick={onClose}
      />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-7xl flex-col">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-cyan-200">
              {viewer.program}
            </p>
            <p className="mt-1 text-sm font-bold text-white">
              {viewer.currentIndex + 1} / {viewer.images.length}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
            aria-label="후기 상세 닫기"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="relative min-h-[360px] overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 shadow-2xl lg:min-h-0">
            <Image
              key={currentImage}
              src={currentImage}
              alt={`${viewer.program} 실제 체험 사진 ${viewer.currentIndex + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />

            {viewer.images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrevious}
                  className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/75"
                  aria-label="이전 사진"
                >
                  <ChevronLeft className="h-7 w-7" />
                </button>

                <button
                  type="button"
                  onClick={goNext}
                  className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/75"
                  aria-label="다음 사진"
                >
                  <ChevronRight className="h-7 w-7" />
                </button>
              </>
            )}
          </div>

          <aside className="flex min-h-0 flex-col rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur">
            <div className="border-b border-white/10 pb-5">
              <p className="text-sm font-semibold text-slate-400">작성자</p>
              <p className="mt-1 text-xl font-black text-white">
                {viewer.userId}
              </p>

              <div className="mt-4 inline-flex rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-100">
                {viewer.program}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto py-5 pr-1">
              <p className="whitespace-pre-line text-base leading-8 text-slate-100">
                “{viewer.comment}”
              </p>
            </div>

            {viewer.images.length > 1 && (
              <div className="border-t border-white/10 pt-5">
                <div className="grid grid-cols-4 gap-2">
                  {viewer.images.map((image, imageIndex) => (
                    <button
                      key={`${viewer.id}-thumb-${image}`}
                      type="button"
                      onClick={() => onChangeIndex(imageIndex)}
                      className={`relative h-16 overflow-hidden rounded-xl border transition ${
                        imageIndex === viewer.currentIndex
                          ? "border-cyan-300"
                          : "border-white/10 opacity-60 hover:opacity-100"
                      }`}
                      aria-label={`${imageIndex + 1}번째 사진 보기`}
                    >
                      <Image
                        src={image}
                        alt={`${viewer.program} 썸네일 ${imageIndex + 1}`}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function DiscoverScubaReviewPhotos() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [viewer, setViewer] = useState<ReviewViewerState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleReviewCount, setVisibleReviewCount] =
    useState(INITIAL_REVIEW_COUNT);

  useEffect(() => {
    async function loadReviews() {
      try {
        const response = await fetch("/api/reviews", {
          cache: "no-store",
        });
        const data = await response.json();

        if (response.ok && data.ok) {
          setReviews(data.reviews || []);
        }
      } catch (error) {
        console.error("[DISCOVER_SCUBA_REVIEWS_LOAD_ERROR]", error);
      } finally {
        setIsLoading(false);
      }
    }

    void loadReviews();
  }, []);

  const experienceReviews = useMemo(() => {
    const visibleReviews = reviews.filter((review) =>
      review.program.includes("체험"),
    );

    return (visibleReviews.length > 0 ? visibleReviews : FALLBACK_REVIEWS)
      .filter((review) => review.images.length > 0);
  }, [reviews]);

  const visibleReviews = experienceReviews.slice(0, visibleReviewCount);
  const hasMoreReviews = visibleReviewCount < experienceReviews.length;

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: INITIAL_REVIEW_COUNT }, (_, index) => (
          <div
            key={index}
            className="aspect-[4/3] animate-pulse rounded-3xl bg-slate-100"
          />
        ))}
      </div>
    );
  }

  if (experienceReviews.length === 0) {
    return null;
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {visibleReviews.map((review) => (
          <article
            key={review.id}
            className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] shadow-xl shadow-black/10"
          >
            <button
              type="button"
              onClick={() =>
                setViewer({
                  ...review,
                  currentIndex: 0,
                })
              }
              className="group relative block aspect-[4/3] w-full bg-slate-900 text-left"
              aria-label={`${review.program} 후기 사진 상세 보기`}
            >
              <Image
                src={review.images[0]}
                alt={`${review.program} 실제 체험 사진`}
                fill
                sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 280px"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-sm font-black text-cyan-200">
                  {review.program}
                </p>
                <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-white">
                  {review.comment}
                </p>
                <p className="mt-3 text-xs font-black text-cyan-100 opacity-0 transition group-hover:opacity-100">
                  사진 크게 보기
                </p>
              </div>
            </button>
          </article>
        ))}
      </div>

      {hasMoreReviews ? (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() =>
              setVisibleReviewCount((current) => current + REVIEW_COUNT_STEP)
            }
            className="inline-flex rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/20"
          >
            체험후기 더보기
          </button>
        </div>
      ) : null}

      {viewer && (
        <ReviewViewer
          viewer={viewer}
          onClose={() => setViewer(null)}
          onChangeIndex={(nextIndex) =>
            setViewer((prev) => {
              if (!prev) {
                return prev;
              }

              return {
                ...prev,
                currentIndex: nextIndex,
              };
            })
          }
        />
      )}
    </>
  );
}
