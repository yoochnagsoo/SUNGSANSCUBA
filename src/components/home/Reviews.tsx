"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Waves,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { naverReviewUrl } from "@/data/reviews";

type Review = {
  id: string;
  userId: string;
  program: string;
  comment: string;
  images: string[];
  isVisible: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type ImageViewerState = {
  reviewId: string;
  userId: string;
  program: string;
  comment: string;
  images: string[];
  currentIndex: number;
};

const INITIAL_HOME_REVIEW_COUNT = 3;
const HOME_REVIEW_COUNT_STEP = 3;

function ImageViewer({
  viewer,
  onClose,
  onChangeIndex,
}: {
  viewer: ImageViewerState;
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
        aria-label="이미지 크게 보기 닫기"
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
            aria-label="이미지 크게 보기 닫기"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="relative min-h-[360px] overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 shadow-2xl lg:min-h-0">
            <Image
              key={currentImage}
              src={currentImage}
              alt={`${viewer.program} 리뷰 사진 ${viewer.currentIndex + 1}`}
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
                  aria-label="이전 이미지"
                >
                  <ChevronLeft className="h-7 w-7" />
                </button>

                <button
                  type="button"
                  onClick={goNext}
                  className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/75"
                  aria-label="다음 이미지"
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
              <div className="mb-3 flex items-center gap-2 text-cyan-200">
                <Waves className="h-4 w-4" />
                <span className="text-sm font-bold">Review Comment</span>
              </div>

              <p className="whitespace-pre-line text-base leading-8 text-slate-100">
                “{viewer.comment}”
              </p>
            </div>

            {viewer.images.length > 1 && (
              <div className="border-t border-white/10 pt-5">
                <div className="grid grid-cols-4 gap-2">
                  {viewer.images.map((image, imageIndex) => (
                    <button
                      key={`${viewer.reviewId}-thumb-${image}`}
                      type="button"
                      onClick={() => onChangeIndex(imageIndex)}
                      className={`relative h-16 overflow-hidden rounded-xl border transition ${
                        imageIndex === viewer.currentIndex
                          ? "border-cyan-300"
                          : "border-white/10 opacity-60 hover:opacity-100"
                      }`}
                      aria-label={`${imageIndex + 1}번째 이미지 보기`}
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

function ReviewImageSlider({
  reviewId,
  userId,
  program,
  comment,
  images,
  onOpenViewer,
}: {
  reviewId: string;
  userId: string;
  program: string;
  comment: string;
  images: string[];
  onOpenViewer: (viewer: ImageViewerState) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 3500);

    return () => {
      window.clearInterval(timer);
    };
  }, [images.length]);

  function goPrevious() {
    setCurrentIndex((prev) => {
      if (prev === 0) {
        return images.length - 1;
      }

      return prev - 1;
    });
  }

  function goNext() {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }

  if (images.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center rounded-3xl bg-slate-800 text-sm font-semibold text-slate-400">
        등록된 사진이 없습니다
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() =>
          onOpenViewer({
            reviewId,
            userId,
            program,
            comment,
            images,
            currentIndex,
          })
        }
        className="group/image relative h-56 w-full overflow-hidden rounded-3xl bg-slate-800 text-left sm:h-64 lg:h-56"
        aria-label={`${program} 리뷰 사진 크게 보기`}
      >
        {images.map((image, imageIndex) => (
          <Image
            key={`${reviewId}-${image}`}
            src={image}
            alt={`${program} 리뷰 사진 ${imageIndex + 1}`}
            fill
            sizes="(max-width: 768px) 90vw, 420px"
            className={`object-cover transition-all duration-700 ${
              imageIndex === currentIndex
                ? "scale-100 opacity-100"
                : "scale-105 opacity-0"
            }`}
            priority={imageIndex === 0}
          />
        ))}

        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/20" />

        <div className="absolute left-3 top-3 rounded-full bg-black/50 px-3 py-1 text-xs font-bold text-white backdrop-blur">
          {currentIndex + 1} / {images.length}
        </div>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-xs font-bold text-white opacity-0 backdrop-blur transition group-hover/image:opacity-100">
          사진 크게 보기 · 전체 후기 보기
        </div>
      </button>

      {images.length > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={goPrevious}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
            aria-label="이전 리뷰 사진"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex justify-center gap-2">
            {images.map((image, imageIndex) => (
              <button
                key={`${reviewId}-dot-${image}`}
                type="button"
                onClick={() => setCurrentIndex(imageIndex)}
                className={`h-2 rounded-full transition-all ${
                  imageIndex === currentIndex
                    ? "w-7 bg-cyan-300"
                    : "w-2 bg-white/25 hover:bg-white/50"
                }`}
                aria-label={`${imageIndex + 1}번째 리뷰 사진 보기`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={goNext}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
            aria-label="다음 리뷰 사진"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [viewer, setViewer] = useState<ImageViewerState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleReviewCount, setVisibleReviewCount] = useState(
    INITIAL_HOME_REVIEW_COUNT,
  );

  const homeReviews = useMemo(() => {
    return reviews.slice(0, visibleReviewCount);
  }, [reviews, visibleReviewCount]);

  const hasMoreReviews = visibleReviewCount < reviews.length;

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
        console.error("[HOME_REVIEWS_LOAD_ERROR]", error);
      } finally {
        setIsLoading(false);
      }
    }

    void loadReviews();
  }, []);

  if (!isLoading && homeReviews.length === 0) {
    return null;
  }

  return (
    <>
      <div className="relative overflow-hidden bg-slate-950 px-4 py-24 text-white sm:px-6 lg:px-8">
        <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_35%)]" />

        <div className="relative mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100">
                <MessageCircle className="h-4 w-4" />
                Real Review
              </div>

              <h2 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                다녀간 분들이 남겨준
                <br />
                <span className="text-cyan-300">성산 바다의 기록</span>
              </h2>

              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
                성산스쿠버에서 체험다이빙, 보트다이빙, 스노클링을 경험한
                고객들의 후기를 사진과 함께 소개합니다.
              </p>
            </div>

            <Link
              href={naverReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/10 transition hover:-translate-y-0.5 hover:bg-cyan-100"
            >
              네이버 리뷰 전체보기
            </Link>
          </div>

          {isLoading ? (
            <div className="grid gap-6 lg:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-[460px] animate-pulse rounded-[2rem] bg-white/[0.06]"
                />
              ))}
            </div>
          ) : (
            <>
              <div className="grid gap-6 lg:grid-cols-3">
                {homeReviews.map((review) => (
                  <article
                    key={review.id}
                    className="group overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] shadow-2xl shadow-black/20 backdrop-blur transition hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-white/[0.09]"
                  >
                    <div className="border-b border-white/10 p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-400">
                            작성자
                          </p>
                          <p className="mt-1 text-lg font-black text-white">
                            {review.userId}
                          </p>
                        </div>

                        <div className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-100">
                          {review.program}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5 p-5">
                      <ReviewImageSlider
                        reviewId={review.id}
                        userId={review.userId}
                        program={review.program}
                        comment={review.comment}
                        images={review.images}
                        onOpenViewer={setViewer}
                      />

                      <div className="rounded-3xl bg-slate-950/50 p-5">
                        <div className="mb-3 flex items-center gap-2 text-cyan-200">
                          <Waves className="h-4 w-4" />
                          <span className="text-sm font-bold">
                            Review Comment
                          </span>
                        </div>

                        <p className="line-clamp-3 text-base leading-8 text-slate-100">
                          “{review.comment}”
                        </p>

                        <p className="mt-4 text-xs font-semibold text-cyan-200/80">
                          사진을 클릭하면 전체 후기를 볼 수 있습니다.
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {hasMoreReviews ? (
                <div className="mt-10 flex justify-center">
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleReviewCount(
                        (current) => current + HOME_REVIEW_COUNT_STEP,
                      )
                    }
                    className="inline-flex rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white/20"
                  >
                    리뷰 더보기
                  </button>
                </div>
              ) : null}
            </>
          )}

          <p className="mt-8 text-center text-sm text-slate-500">
            리뷰 이미지는 관리자가 직접 선별하여 등록한 사진입니다.
          </p>
        </div>
      </div>

      {viewer && (
        <ImageViewer
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
