import Link from "next/link";

import { PROGRAM_OPTIONS } from "@/lib/programs";
import Footer from "@/components/layout/Footer";

function getReservationHref(program: string) {
  return `/reservation?program=${encodeURIComponent(program)}`;
}

export default function DiscoverScubaPage() {
  const experiencePrograms = PROGRAM_OPTIONS.filter((program) =>
    program.value.startsWith("체험 다이빙"),
  );

  const coursePrograms = PROGRAM_OPTIONS.filter(
    (program) => !program.value.startsWith("체험 다이빙"),
  );

  return (
    <main className="min-h-screen bg-[#f5f8fb] text-slate-950">
      <section className="relative overflow-hidden bg-[#061827]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(14,165,233,0.35),transparent_34%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.24),transparent_30%),linear-gradient(135deg,rgba(2,6,23,0.35),rgba(2,6,23,0.96))]" />
        <div className="absolute -left-20 top-20 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute -bottom-24 right-10 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-black/10 backdrop-blur-md transition hover:bg-white/20"
            >
              <span className="transition group-hover:-translate-x-0.5">←</span>
              메인으로
            </Link>

            <Link
              href="/reservation"
              className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-950 shadow-lg shadow-black/10 transition hover:bg-cyan-100"
            >
              예약하기
            </Link>
          </div>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-12 sm:px-6 lg:px-8 lg:pb-28 lg:pt-20">
          <div className="max-w-4xl">
            <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.35em] text-cyan-100 shadow-lg shadow-black/10 backdrop-blur-md">
              SUNG SAN SCUBA
            </div>

            <h1 className="mt-7 text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
              성산 바다에서 시작하는
              <span className="block bg-gradient-to-r from-cyan-200 via-sky-300 to-blue-300 bg-clip-text text-transparent">
                프리미엄 다이빙 경험
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              처음 다이빙을 경험하는 분부터 자격증 보유 다이버까지, 목적과
              경험에 맞는 프로그램을 선택할 수 있습니다.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href={getReservationHref("체험 다이빙 1:4")}
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-4 text-sm font-black text-white shadow-lg shadow-blue-500/25 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/30"
              >
                체험 다이빙 예약하기
              </Link>

              <a
                href="#programs"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-6 py-4 text-sm font-black text-white backdrop-blur-md transition hover:bg-white/20"
              >
                프로그램 보기
              </a>
            </div>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            <HeroFeature title="소규모 운영" description="강사 배정 기준 관리" />
            <HeroFeature title="성산 바다" description="제주 동쪽 다이빙 포인트" />
            <HeroFeature title="예약 확정 안내" description="이메일로 체험시간 안내" />
          </div>
        </div>
      </section>

      <section
        id="programs"
        className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-600">
              Experience Diving
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
              체험 다이빙 선택
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              처음 다이빙하는 분들을 위한 프로그램입니다. 인원 구성과 케어
              강도에 따라 1:4 또는 1:2 프로그램을 선택할 수 있습니다.
            </p>
          </div>

          <Link
            href="/reservation"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-800 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
          >
            전체 예약 페이지로 이동
          </Link>
        </div>

        <div className="mt-9 grid gap-6 lg:grid-cols-2">
          {experiencePrograms.map((program) => (
            <ExperienceProgramCard key={program.value} program={program} />
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-600">
              Courses & Certified Diving
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
              펀 다이빙 & 교육 과정
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              자격증 보유자 또는 교육 희망자를 위한 프로그램입니다. 일정과
              포인트는 예약 신청 후 상담을 통해 확정됩니다.
            </p>
          </div>

          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {coursePrograms.map((program) => (
              <CourseProgramCard key={program.value} program={program} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="overflow-hidden rounded-[2rem] bg-slate-950 shadow-2xl shadow-slate-300">
          <div className="grid gap-0 lg:grid-cols-[1fr_420px]">
            <div className="p-6 sm:p-10 lg:p-12">
              <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
                Reservation Guide
              </p>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-5xl">
                예약은 신청 후 확정됩니다
              </h2>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                해상 상황, 날씨, 인원, 강사 배정에 따라 체험 시간이 조정될 수
                있습니다. 신청 후 관리자가 확인하여 예약 확정 안내를 보내드립니다.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <GuideBox title="01. 예약 신청" description="프로그램과 희망일을 선택합니다." />
                <GuideBox title="02. 일정 확인" description="관리자가 인원과 해상 상황을 확인합니다." />
                <GuideBox title="03. 시간 확정" description="체험시간과 준비사항을 이메일로 안내합니다." />
                <GuideBox title="04. 방문 체험" description="예약 시간보다 여유 있게 도착해주세요." />
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-cyan-500 p-6 text-white sm:p-10 lg:p-12">
              <p className="text-sm font-black uppercase tracking-[0.25em] text-blue-100">
                Quick Reserve
              </p>
              <h3 className="mt-4 text-3xl font-black">
                가장 많이 선택하는 프로그램
              </h3>

              <div className="mt-7 rounded-3xl bg-white/15 p-5 backdrop-blur">
                <p className="text-sm font-bold text-blue-100">체험 다이빙 1:4</p>
                <p className="mt-2 text-4xl font-black">69,000원</p>
                <p className="mt-1 text-sm font-semibold text-blue-50">
                  1인 기준 / 강사 1명당 최대 4명
                </p>
              </div>

              <Link
                href={getReservationHref("체험 다이빙 1:4")}
                className="mt-7 inline-flex w-full items-center justify-center rounded-2xl bg-white px-6 py-4 text-sm font-black text-blue-700 shadow-lg shadow-blue-900/10 transition hover:bg-blue-50"
              >
                체험 다이빙 1:4 예약하기
              </Link>

              <Link
                href={getReservationHref("체험 다이빙 1:2")}
                className="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-6 py-4 text-sm font-black text-white backdrop-blur transition hover:bg-white/20"
              >
                아이/커플 1:2 예약하기
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="location" className="scroll-mt-24">
        <Footer />
      </section>
      
    </main>
  );
}

function HeroFeature({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-lg shadow-black/10 backdrop-blur-md">
      <p className="font-black text-white">{title}</p>
      <p className="mt-1 text-sm text-slate-300">{description}</p>
    </div>
  );
}

function ExperienceProgramCard({
  program,
}: {
  program: (typeof PROGRAM_OPTIONS)[number];
}) {
  return (
    <article className="group overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/70 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-300">
      <div className="bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">
              Discover Scuba
            </p>
            <h3 className="mt-3 text-3xl font-black">{program.label}</h3>
          </div>

          {program.maxGuestsPerInstructor ? (
            <div className="rounded-2xl bg-white/10 px-4 py-3 text-right backdrop-blur">
              <p className="text-xs font-bold text-slate-300">강사 1명당</p>
              <p className="text-xl font-black text-white">
                최대 {program.maxGuestsPerInstructor}명
              </p>
            </div>
          ) : null}
        </div>

        <p className="mt-5 text-sm leading-7 text-slate-300">
          {program.shortDescription}
        </p>
      </div>

      <div className="p-6 sm:p-8">
        <div className="rounded-3xl bg-gradient-to-br from-blue-50 to-cyan-50 p-5 ring-1 ring-blue-100">
          <p className="text-xs font-black text-blue-700">가격</p>
          <p className="mt-1 text-4xl font-black text-blue-950">
            {program.price}
          </p>
          <p className="mt-1 text-sm font-bold text-blue-700">
            {program.priceDescription}
          </p>
        </div>

        <div className="mt-5 grid gap-3">
          <InfoRow label="소요시간" value={program.duration} />
          <InfoRow label="추천대상" value={program.recommendedFor} />
          {program.maxGuestsPerInstructor ? (
            <InfoRow
              label="진행기준"
              value={`강사 1명당 최대 ${program.maxGuestsPerInstructor}명`}
            />
          ) : null}
        </div>

        <Link
          href={getReservationHref(program.value)}
          className="mt-7 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-4 text-sm font-black text-white shadow-lg shadow-blue-500/25 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/30"
        >
          이 프로그램 예약하기
        </Link>
      </div>
    </article>
  );
}

function CourseProgramCard({
  program,
}: {
  program: (typeof PROGRAM_OPTIONS)[number];
}) {
  return (
    <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-100 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-slate-200">
      <p className="text-sm font-black text-blue-600">{program.price}</p>
      <h3 className="mt-2 text-2xl font-black text-slate-950">
        {program.label}
      </h3>
      <p className="mt-3 min-h-14 text-sm leading-6 text-slate-600">
        {program.shortDescription}
      </p>

      <div className="mt-5 space-y-3">
        <InfoRow label="소요시간" value={program.duration} />
        <InfoRow label="추천대상" value={program.recommendedFor} />
      </div>

      <Link
        href={getReservationHref(program.value)}
        className="mt-6 inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-950 px-5 py-3.5 text-sm font-black text-white transition hover:bg-blue-700"
      >
        상담 예약하기
      </Link>
    </article>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-100">
      <p className="text-xs font-black text-slate-500">{label}</p>
      <p className="text-right text-sm font-bold text-slate-950">{value}</p>
    </div>
  );
}

function GuideBox({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
      <p className="font-black text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
    </div>
  );
}