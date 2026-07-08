import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Compass,
  GraduationCap,
  LifeBuoy,
  MapPin,
  ShieldCheck,
  Sparkles,
  Waves,
} from "lucide-react";

const courses = [
  {
    title: "Discover Scuba Diving",
    subtitle: "처음 바다를 만나는 체험 다이빙",
    description:
      "자격증 과정 전, 스쿠버가 나에게 맞는지 가볍게 경험해보는 입문 프로그램입니다.",
    icon: Waves,
    image: "/images/padi/padi-01.jpg",
    tags: ["입문", "체험", "초보 가능"],
  },
  {
    title: "Open Water Diver",
    subtitle: "정식 다이버가 되는 첫 단계",
    description:
      "이론, 제한수역, 개방수역 교육을 통해 독립적인 레크리에이션 다이버로 성장하는 기본 자격 과정입니다.",
    icon: GraduationCap,
    image: "/images/padi/padi-02.jpg",
    tags: ["자격증", "기초 과정", "PADI"],
  },
  {
    title: "Advanced Open Water Diver",
    subtitle: "더 넓은 바다로 나아가는 과정",
    description:
      "수중 항법, 딥 다이빙 등 다양한 어드벤처 다이빙을 통해 경험과 자신감을 확장합니다.",
    icon: Compass,
    image: "/images/padi/padi-03.jpg",
    tags: ["중급", "경험 확장", "어드벤처"],
  },
  {
    title: "Rescue Diver",
    subtitle: "안전과 대처 능력을 키우는 과정",
    description:
      "다이버 자신과 버디의 안전을 더 깊게 이해하고, 문제 예방과 대응 능력을 배우는 과정입니다.",
    icon: LifeBuoy,
    image: "/images/padi/padi-04.jpg",
    tags: ["안전", "구조", "상급"],
  },
];

const steps = [
  {
    title: "상담 및 일정 확인",
    description: "현재 실력, 희망 코스, 여행 일정에 맞춰 교육 플랜을 잡습니다.",
  },
  {
    title: "이론 교육",
    description: "다이빙 원리, 장비, 안전 수칙을 이해하고 필요한 지식을 준비합니다.",
  },
  {
    title: "제한수역 스킬",
    description: "얕고 안정적인 환경에서 기본 스킬을 반복 연습합니다.",
  },
  {
    title: "개방수역 다이빙",
    description: "성산 바다에서 실제 다이빙 환경에 적응하며 교육을 마무리합니다.",
  },
];

const highlights = [
  "성산 바다 환경에 맞춘 교육 진행",
  "초보자도 이해하기 쉬운 단계별 설명",
  "소규모 교육 중심의 안정적인 진행",
  "장비 착용부터 입수까지 꼼꼼한 케어",
  "체험 이후 자격증 과정으로 자연스럽게 연계",
  "예약 전 상담을 통한 맞춤 일정 안내",
];

export default function PadiPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="relative min-h-screen overflow-hidden">
        <Image
          src="/images/padi/padi-hero.jpg"
          alt="SUNG SAN SCUBA PADI 다이빙 교육"
          fill
          priority
          className="object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/75 to-cyan-950/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/20" />

        <div className="absolute left-[-10%] top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute bottom-10 right-[-8%] h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 sm:px-8 lg:px-12">
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
              SUNG SAN SCUBA PADI
            </div>
          </header>

          <div className="flex flex-1 flex-col justify-center py-20">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-100 backdrop-blur">
                <Sparkles className="h-4 w-4" />
                PADI Diving Course
              </div>

              <h1 className="text-5xl font-black leading-tight tracking-tight sm:text-6xl lg:text-7xl">
                성산 바다에서
                <br />
                <span className="bg-gradient-to-r from-cyan-200 via-sky-300 to-blue-400 bg-clip-text text-transparent">
                  PADI 다이버
                </span>
                가 되다
              </h1>

              <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-200 sm:text-xl">
                처음 바다에 들어가는 체험 다이빙부터 Open Water, Advanced,
                Rescue 과정까지. SUNG SAN SCUBA에서 제주 성산의 바다를 배우고
                경험하세요.
              </p>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/reservation"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-cyan-300 px-7 py-4 text-base font-black text-slate-950 shadow-2xl shadow-cyan-500/20 transition hover:bg-white"
                >
                  교육 상담 예약
                  <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
                </Link>

                <a
                  href="#courses"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-7 py-4 text-base font-bold text-white backdrop-blur transition hover:bg-white/20"
                >
                  코스 보기
                </a>
              </div>
            </div>

            <div className="mt-16 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-3xl font-black text-cyan-200">01</p>
                <p className="mt-2 text-sm font-bold text-white">초보자 가능</p>
                <p className="mt-1 text-sm text-slate-300">
                  물이 무서운 분도 천천히 적응
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-3xl font-black text-cyan-200">02</p>
                <p className="mt-2 text-sm font-bold text-white">
                  성산 바다 교육
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  제주 동쪽 바다 환경 기반
                </p>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur">
                <p className="text-3xl font-black text-cyan-200">03</p>
                <p className="mt-2 text-sm font-bold text-white">단계별 코스</p>
                <p className="mt-1 text-sm text-slate-300">
                  체험부터 자격증까지 연결
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-slate-950 px-6 py-24 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-200">
                <Award className="h-4 w-4" />
                Why PADI
              </div>

              <h2 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">
                다이빙을 제대로 시작하는
                <br />
                가장 익숙한 이름
              </h2>

              <p className="mt-6 text-lg leading-8 text-slate-300">
                PADI는 전 세계적으로 알려진 스쿠버 다이빙 교육 기관입니다.
                SUNG SAN SCUBA는 입문자도 부담 없이 이해할 수 있도록 교육 과정,
                장비 사용, 바다 적응을 단계별로 안내합니다.
              </p>

              <div className="mt-8 grid gap-3">
                {highlights.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
                    <p className="text-sm font-semibold text-slate-200">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-8 -top-8 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl" />
              <div className="absolute -bottom-8 -right-8 h-52 w-52 rounded-full bg-blue-500/20 blur-3xl" />

              <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/10 p-3 shadow-2xl shadow-black/40">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem]">
                  <Image
                    src="/images/padi/padi-main.jpg"
                    alt="성산 스쿠버 다이빙 교육"
                    fill
                    className="object-cover transition duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                  <div className="absolute bottom-6 left-6 right-6 rounded-3xl border border-white/15 bg-slate-950/55 p-5 backdrop-blur">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
                        <ShieldCheck className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-black">Safety First</p>
                        <p className="mt-1 text-sm text-slate-300">
                          안전 브리핑 · 장비 체크 · 단계별 입수
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="courses"
        className="relative overflow-hidden bg-slate-900 px-6 py-24 sm:px-8 lg:px-12"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-cyan-200">
                <BookOpen className="h-4 w-4" />
                Course Line-up
              </div>

              <h2 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">
                원하는 깊이만큼
                <br />
                단계별로 배우는 코스
              </h2>
            </div>

            <p className="max-w-xl text-base leading-7 text-slate-300">
              일정, 바다 컨디션, 개인 숙련도에 따라 실제 진행 방식은 달라질 수
              있습니다. 예약 전 상담을 통해 가장 적합한 코스를 안내합니다.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {courses.map((course) => {
              const Icon = course.icon;

              return (
                <article
                  key={course.title}
                  className="group overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950 shadow-xl shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/40"
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={course.image}
                      alt={course.title}
                      fill
                      className="object-cover transition duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent" />

                    <div className="absolute left-5 top-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950 shadow-xl">
                      <Icon className="h-6 w-6" />
                    </div>

                    <div className="absolute bottom-5 left-5 right-5">
                      <div className="flex flex-wrap gap-2">
                        {course.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 sm:p-7">
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">
                      {course.title}
                    </p>
                    <h3 className="mt-3 text-2xl font-black text-white">
                      {course.subtitle}
                    </h3>
                    <p className="mt-4 leading-7 text-slate-300">
                      {course.description}
                    </p>

                    <Link
                      href="/reservation"
                      className="mt-6 inline-flex items-center gap-2 text-sm font-black text-cyan-200 transition hover:text-white"
                    >
                      상담 예약하기
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-6 py-24 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div className="lg:sticky lg:top-24">
              <div className="inline-flex items-center gap-2 rounded-full bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-200">
                <MapPin className="h-4 w-4" />
                Learning Flow
              </div>

              <h2 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">
                처음부터 끝까지
                <br />
                복잡하지 않게
              </h2>

              <p className="mt-6 text-lg leading-8 text-slate-300">
                처음 다이빙을 배우는 분들이 가장 어려워하는 부분은 바다보다
                절차입니다. SUNG SAN SCUBA는 상담, 교육, 장비, 입수 과정을
                하나씩 안내합니다.
              </p>
            </div>

            <div className="grid gap-4">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className="group rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 transition hover:border-cyan-300/40 hover:bg-white/[0.07]"
                >
                  <div className="flex gap-5">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-xl font-black text-slate-950 transition group-hover:bg-cyan-300">
                      {String(index + 1).padStart(2, "0")}
                    </div>

                    <div>
                      <h3 className="text-xl font-black text-white">
                        {step.title}
                      </h3>
                      <p className="mt-2 leading-7 text-slate-300">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-cyan-300 px-6 py-24 text-slate-950 sm:px-8 lg:px-12">
        <div className="absolute left-[-10%] top-[-20%] h-80 w-80 rounded-full bg-white/40 blur-3xl" />
        <div className="absolute bottom-[-25%] right-[-10%] h-96 w-96 rounded-full bg-blue-400/30 blur-3xl" />

        <div className="relative mx-auto max-w-5xl text-center">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-700">
            SUNG SAN SCUBA Dive Center
          </p>

          <h2 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">
            이제 바다를 구경하는 사람이 아니라
            <br />
            바다를 경험하는 사람이 되어보세요.
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg font-semibold leading-8 text-slate-800">
            체험 다이빙부터 PADI 자격 과정까지, 성산 바다에서 당신의 첫
            다이빙 여정을 시작하세요.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/reservation"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-8 py-4 text-base font-black text-white shadow-2xl shadow-slate-950/20 transition hover:bg-white hover:text-slate-950"
            >
              예약 상담하기
              <ArrowRight className="h-5 w-5" />
            </Link>

            <Link
              href="/discover-scuba"
              className="inline-flex items-center justify-center rounded-full border border-slate-950/20 bg-white/30 px-8 py-4 text-base font-black text-slate-950 backdrop-blur transition hover:bg-white"
            >
              체험 다이빙 먼저 보기
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}