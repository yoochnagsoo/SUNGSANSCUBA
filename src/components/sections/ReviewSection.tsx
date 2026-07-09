import Image from "next/image";
import Link from "next/link";
import { MessageCircle, Waves } from "lucide-react";

import { naverReviewUrl, reviewItems } from "@/data/reviews";

export default function ReviewSection() {
  return (
    <section className="relative overflow-hidden bg-slate-950 px-4 py-24 text-white sm:px-6 lg:px-8">
      <div className="absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

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
              고객들의 실제 후기를 모아 보여드립니다.
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

        <div className="grid gap-6 lg:grid-cols-3">
          {reviewItems.map((review) => (
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
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
                  {review.images.map((image, imageIndex) => (
                    <div
                      key={`${review.id}-${image}`}
                      className="relative h-48 min-w-[78%] overflow-hidden rounded-3xl bg-slate-800 sm:min-w-[68%] lg:min-w-[82%]"
                    >
                      <Image
                        src={image}
                        alt={`${review.program} 리뷰 사진 ${imageIndex + 1}`}
                        fill
                        sizes="(max-width: 768px) 80vw, 360px"
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />

                      <div className="absolute left-3 top-3 rounded-full bg-black/45 px-3 py-1 text-xs font-bold text-white backdrop-blur">
                        {imageIndex + 1} / {review.images.length}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="rounded-3xl bg-slate-950/50 p-5">
                  <div className="mb-3 flex items-center gap-2 text-cyan-200">
                    <Waves className="h-4 w-4" />
                    <span className="text-sm font-bold">Review Comment</span>
                  </div>

                  <p className="text-base leading-8 text-slate-100">
                    “{review.comment}”
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          리뷰 이미지는 관리자가 직접 선별하여 등록한 사진입니다.
        </p>
      </div>
    </section>
  );
}