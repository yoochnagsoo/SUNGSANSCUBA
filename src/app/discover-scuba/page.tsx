import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Clock, ShieldCheck, Waves } from "lucide-react";

import DepthGuide from "@/components/discover-scuba/DepthGuide";
import DiscoverScubaReviewPhotos from "@/components/discover-scuba/DiscoverScubaReviewPhotos";
import FishPreview from "@/components/discover-scuba/FishPreview";
import Footer from "@/components/layout/Footer";
import { PROGRAM_OPTIONS } from "@/lib/programs";

function getReservationHref(program: string) {
  return `/reservation?program=${encodeURIComponent(program)}`;
}

const experiencePrograms = PROGRAM_OPTIONS.filter((program) =>
  program.value.startsWith("체험 다이빙"),
);

export default function DiscoverScubaPage() {
  const primaryProgram =
    experiencePrograms.find((program) => program.value.includes("1:4")) ||
    experiencePrograms[0];
  const privateProgram =
    experiencePrograms.find((program) => program.value.includes("1:2")) ||
    experiencePrograms[1];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <Image
          src="/images/courses/discover1.jpg"
          alt="성산 체험다이빙"
          fill
          priority
          className="object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/35" />
        <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20"
            >
              메인으로
            </Link>
            <Link
              href="/reservation"
              className="rounded-full bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
            >
              예약하기
            </Link>
          </div>
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-20 pt-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8 lg:pb-28 lg:pt-20">
          <div>
            <p className="inline-flex rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-cyan-100 backdrop-blur">
              Discover Scuba Diving
            </p>
            <h1 className="mt-7 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl lg:text-7xl">
              처음 만나는 성산 바다,
              <span className="block text-cyan-200">최대 수심 5m 체험다이빙</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base font-medium leading-8 text-slate-200 sm:text-lg">
              수영을 잘하지 못해도 괜찮습니다. 강사가 장비 착용부터
              수중 호흡, 이동까지 함께하며 0m에서 시작해 1~2m, 3~5m
              단계로 천천히 적응합니다.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {primaryProgram ? (
                <Link
                  href={getReservationHref(primaryProgram.value)}
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-cyan-300 px-6 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
                >
                  체험 다이빙 예약하기
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
              <a
                href="#depth"
                className="inline-flex h-14 items-center justify-center rounded-full border border-white/15 bg-white/10 px-6 text-sm font-black text-white backdrop-blur transition hover:bg-white/20"
              >
                수심 단계 보기
              </a>
            </div>
          </div>

          <aside className="rounded-[2rem] border border-white/10 bg-white/10 p-6 backdrop-blur">
            <p className="text-sm font-black text-cyan-200">체험 핵심 안내</p>
            <div className="mt-5 space-y-4">
              <HeroFact
                icon={<ShieldCheck className="h-5 w-5" />}
                label="최대 수심"
                value="5m 이내"
              />
              <HeroFact
                icon={<Waves className="h-5 w-5" />}
                label="적응 단계"
                value="0m → 1~2m → 3~5m"
              />
              <HeroFact
                icon={<Clock className="h-5 w-5" />}
                label="진행 기준"
                value="해상 상황과 컨디션 우선"
              />
            </div>
          </aside>
        </div>
      </section>

      <section id="depth" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mb-9 max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-600">
            Depth Guide
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
            수심은 단계별로 천천히 적응합니다
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-600">
            체험다이빙은 깊이보다 안정감이 먼저입니다. 성산스쿠버는
            최대 수심을 5m 이내로 안내하며, 당일 컨디션과 바다 상태에
            따라 무리하지 않게 진행합니다.
          </p>
        </div>
        <DepthGuide />
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mb-9 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-600">
                Program
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
                체험 방식 선택
              </h2>
            </div>
            <Link
              href="/reservation"
              className="inline-flex w-fit rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 transition hover:border-cyan-300 hover:bg-cyan-50"
            >
              전체 예약 페이지
            </Link>
          </div>

          <div className="grid items-stretch gap-5 lg:grid-cols-2">
            {primaryProgram ? <ProgramCard program={primaryProgram} /> : null}
            {privateProgram ? <ProgramCard program={privateProgram} /> : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mb-9 max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-600">
            Marine Life
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
            체험 중 만날 수 있는 바다 생물
          </h2>
          <p className="mt-4 text-base leading-8 text-slate-600">
            얕은 수심에서도 성산 바다의 작은 물고기와 소라, 해삼, 해조류를
            가까이에서 만날 수 있습니다. 당일 시야와 바다 컨디션에 따라
            만나는 생물은 달라지지만, 처음 바다를 경험하는 순간은 충분히
            특별합니다.
          </p>
        </div>
        <FishPreview />
      </section>

      <section className="bg-slate-950 px-4 py-16 text-white sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-9 max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
              Real Review Photos
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
              실제 체험 사진으로 보는 성산 바다
            </h2>
            <p className="mt-4 text-base leading-8 text-slate-300">
              메인 페이지 Real Review와 같은 리뷰 데이터를 사용해 실제
              체험 사진을 보여줍니다.
            </p>
          </div>
          <DiscoverScubaReviewPhotos />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-cyan-600 to-blue-700 p-6 text-white shadow-2xl shadow-cyan-200 sm:p-10 lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-100">
                Safety First
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
                예약 후 해상 상황을 확인해 체험 시간을 확정합니다
              </h2>
              <p className="mt-5 text-base leading-8 text-cyan-50">
                체험은 접수 후 바로 확정되는 방식이 아니라, 당일 바다 상태와
                인원, 강사 배정, 체험자 컨디션을 확인한 뒤 안전하게 안내합니다.
              </p>
            </div>
            <Link
              href={primaryProgram ? getReservationHref(primaryProgram.value) : "/reservation"}
              className="inline-flex h-14 items-center justify-center rounded-full bg-white px-6 text-sm font-black text-blue-700 transition hover:bg-cyan-50"
            >
              체험다이빙 예약하기
            </Link>
          </div>
        </div>
      </section>

      <section id="location" className="scroll-mt-24">
        <Footer />
      </section>
    </main>
  );
}

function HeroFact({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white/10 p-4">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-300/15 text-cyan-200">
        {icon}
      </div>
      <div>
        <p className="text-xs font-bold text-slate-300">{label}</p>
        <p className="mt-1 font-black text-white">{value}</p>
      </div>
    </div>
  );
}

function ProgramCard({
  program,
}: {
  program: (typeof PROGRAM_OPTIONS)[number];
}) {
  return (
    <article className="flex h-full flex-col rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="flex flex-1 flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-black text-cyan-600">Discover Scuba</p>
          <h3 className="mt-2 text-2xl font-black text-slate-950">
            {program.label}
          </h3>
          <p className="mt-4 text-sm font-semibold leading-7 text-slate-600">
            {program.shortDescription}
          </p>
        </div>
        <div className="shrink-0 rounded-2xl bg-cyan-50 px-4 py-3 text-left ring-1 ring-cyan-100 sm:min-w-32 sm:text-right">
          <p className="text-xs font-black text-cyan-700">가격</p>
          <p className="mt-1 text-2xl font-black text-slate-950">
            {program.price}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <InfoPill label="소요시간" value={program.duration} />
        <InfoPill label="추천대상" value={program.recommendedFor} />
        <InfoPill
          label="강사 배정"
          value={
            program.maxGuestsPerInstructor
              ? `최대 ${program.maxGuestsPerInstructor}명`
              : "상담 후 안내"
          }
        />
      </div>

      <Link
        href={getReservationHref(program.value)}
        className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-4 text-sm font-black text-white transition hover:bg-cyan-700"
      >
        이 프로그램 예약하기
        <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-24 flex-col rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
      <p className="text-xs font-black text-slate-500">{label}</p>
      <p className="mt-1 flex-1 text-sm font-bold leading-6 text-slate-950">
        {value}
      </p>
    </div>
  );
}
