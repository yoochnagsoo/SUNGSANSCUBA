import FacilityPhotos from "@/components/about/FacilityPhotos";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  Compass,
  HeartHandshake,
  LifeBuoy,
  MapPin,
  ShieldCheck,
  Sparkles,
  Waves,
} from "lucide-react";
import { siteConfig } from "@/data/site";
import Footer from "@/components/layout/Footer";

const values = [
  {
    icon: ShieldCheck,
    title: "Safety First",
    description:
      "다이빙 전 안전 브리핑, 장비 점검, 해상 상황 확인을 우선으로 운영합니다.",
  },
  {
    icon: HeartHandshake,
    title: "Small Group Care",
    description:
      "체험자의 경험과 컨디션에 맞춰 무리하지 않는 소규모 케어를 지향합니다.",
  },
  {
    icon: Waves,
    title: "Local Ocean Guide",
    description:
      "성산 바다의 조류, 시야, 포인트 특성을 고려해 가장 적합한 코스를 안내합니다.",
  },
];

const safetyRules = [
  "체험 전 건강 상태와 다이빙 경험 여부 확인",
  "입수 전 장비 착용 및 호흡법 브리핑",
  "기상 및 해상 상황에 따른 일정 조정",
  "초보자도 이해하기 쉬운 단계별 수중 적응",
  "강사 판단에 따라 안전 우선으로 코스 변경 가능",
  "음주 후 체험 및 무리한 입수 제한",
];

const facilities = [
  {
    title: "다이빙 장비",
    description: "체험과 교육에 필요한 기본 장비를 보유하고 관리합니다.",
  },
  {
    title: "안전 브리핑",
    description: "입수 전 호흡법, 수신호, 이동 방법을 자세히 안내합니다.",
  },
  {
    title: "성산 포인트 안내",
    description: "섬여, 불상, 자리여 등 성산권 포인트를 중심으로 운영합니다.",
  },
  {
    title: "예약 확정 안내",
    description: "접수 후 관리자가 일정과 가능 시간을 확인해 안내합니다.",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <Image
          src="/images/about/about-hero.jpg"
          alt={siteConfig.fullName}
          fill
          priority
          className="object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/75 to-slate-950/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/30" />

        <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-black/20 backdrop-blur transition hover:bg-white hover:text-slate-950"
            >
              <ArrowLeft className="h-4 w-4" />
              메인으로
            </Link>

            <Link
              href="/reservation"
              className="rounded-full bg-cyan-300 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-950 shadow-lg shadow-cyan-500/25 transition hover:bg-white"
            >
              Reserve
            </Link>
          </header>

          <div className="flex min-h-[720px] items-center py-20">
            <div className="max-w-4xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.35em] text-cyan-100 backdrop-blur">
                <Sparkles className="h-4 w-4" />
                About Seong San Scuba
              </p>

              <h1 className="mt-7 text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-8xl">
                성산 바다를 가장 가까이 만나는
                <span className="block text-cyan-300">다이빙 센터</span>
              </h1>

              <p className="mt-7 max-w-2xl text-base font-medium leading-8 text-slate-200 sm:text-lg">
                SEONG SAN SCUBA는 제주 성산의 바다를 기반으로 체험 다이빙,
                펀 다이빙, PADI 교육을 운영하는 다이빙 센터입니다. 처음
                다이빙을 접하는 분들도 안전하고 편안하게 바다를 경험할 수
                있도록 차분한 안내와 단계별 진행을 중요하게 생각합니다.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/reservation"
                  className="inline-flex h-16 items-center justify-center gap-3 rounded-full bg-cyan-300 px-8 text-sm font-black uppercase tracking-[0.18em] text-slate-950 shadow-xl shadow-cyan-500/25 transition hover:-translate-y-0.5 hover:bg-white"
                >
                  예약하기
                  <ArrowRight className="h-5 w-5" />
                </Link>

                <Link
                  href="/gallery"
                  className="inline-flex h-16 items-center justify-center gap-3 rounded-full border border-white/20 bg-white/10 px-8 text-sm font-black uppercase tracking-[0.18em] text-white shadow-xl shadow-black/20 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:text-slate-950"
                >
                  갤러리 보기
                  <Compass className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-white px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(14,165,233,0.12),transparent_32%),radial-gradient(circle_at_90%_20%,rgba(59,130,246,0.08),transparent_30%)]" />

        <div className="relative mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-100 shadow-2xl shadow-slate-200">
            <div className="relative h-[520px]">
              <Image
                src="/images/about/about-center.jpg"
                alt="SEONG SAN SCUBA Dive Center"
                fill
                className="object-cover"
              />
            </div>

            <div className="absolute bottom-6 left-6 right-6 rounded-[2rem] border border-white/30 bg-white/80 p-5 shadow-xl shadow-slate-950/10 backdrop-blur">
              <p className="text-sm font-black uppercase tracking-[0.25em] text-cyan-600">
                Jeju Seongsan
              </p>
              <p className="mt-2 text-2xl font-black text-slate-950">
                성산 바다와 가까운 다이빙 베이스
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm font-black uppercase tracking-[0.4em] text-cyan-500">
              Our Story
            </p>

            <h2 className="mt-5 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              처음 다이빙하는 순간도
              <span className="block text-cyan-600">안전하고 편안하게</span>
            </h2>

            <p className="mt-7 text-lg leading-9 text-slate-600">
              다이빙은 특별한 경험이지만, 처음 접하는 분들에게는 낯설고
              긴장될 수 있습니다. SEONG SAN SCUBA는 빠르게 진행하는 체험보다
              충분히 설명하고, 천천히 적응하며, 안전하게 바다를 즐기는 과정을
              더 중요하게 생각합니다.
            </p>

            <p className="mt-5 text-lg leading-9 text-slate-600">
              성산 앞바다는 제주 동쪽의 아름다운 바다색과 다양한 수중 지형을
              함께 만날 수 있는 곳입니다. 체험자의 수준과 당일 해상 상태를
              고려해 무리하지 않는 일정으로 안내합니다.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <StatCard value="01" label="안전 우선 운영" />
              <StatCard value="30m" label="좋은 날의 수중 시야" />
              <StatCard value="PADI" label="다이버 교육 과정" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-4 py-24 text-white sm:px-6 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <p className="text-sm font-black uppercase tracking-[0.4em] text-cyan-300">
              Philosophy
            </p>

            <h2 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              우리가 중요하게 생각하는 것
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              좋은 다이빙은 멋진 사진보다 먼저, 안전한 진행과 편안한 경험에서
              시작됩니다.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {values.map((value) => {
              const Icon = value.icon;

              return (
                <div
                  key={value.title}
                  className="rounded-[2rem] border border-white/10 bg-white/10 p-7 shadow-2xl shadow-black/20 backdrop-blur"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
                    <Icon className="h-7 w-7" />
                  </div>

                  <h3 className="mt-7 text-2xl font-black text-white">
                    {value.title}
                  </h3>

                  <p className="mt-4 text-sm leading-7 text-slate-300">
                    {value.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#f5f8fb] px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1fr_1fr] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.4em] text-cyan-500">
              Safety
            </p>

            <h2 className="mt-5 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              안전을 기준으로
              <span className="block text-cyan-600">일정을 확정합니다</span>
            </h2>

            <p className="mt-6 text-lg leading-9 text-slate-600">
              예약 신청은 접수 단계이며, 실제 체험 시간은 당일 또는 예정일의
              기상, 파도, 조류, 시야 상황을 고려해 확정됩니다. 안전하지 않은
              조건에서는 일정이 변경될 수 있습니다.
            </p>

            <div className="mt-8 rounded-[2rem] border border-cyan-100 bg-white p-6 shadow-xl shadow-slate-200/70">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                  <LifeBuoy className="h-6 w-6" />
                </div>

                <div>
                  <p className="text-xl font-black text-slate-950">
                    무리한 입수보다 안전한 취소가 우선입니다
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    해상 상황이 좋지 않을 경우, 체험자의 안전을 위해 일정 변경
                    또는 취소 안내를 드릴 수 있습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2.5rem] bg-white p-6 shadow-2xl shadow-slate-200/80 sm:p-8">
            <div className="grid gap-4">
              {safetyRules.map((rule) => (
                <div
                  key={rule}
                  className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-600" />
                  <p className="text-sm font-bold leading-6 text-slate-700">
                    {rule}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 grid gap-8 lg:grid-cols-[1fr_520px] lg:items-end">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.4em] text-cyan-500">
                Center Guide
              </p>

              <h2 className="mt-5 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                편안한 준비와
                <span className="block text-cyan-600">안정적인 진행</span>
              </h2>
            </div>

            <p className="text-lg leading-8 text-slate-500">
              장비 착용부터 입수 전 안내, 체험 후 정리까지 처음 방문하는 분들도
              어렵지 않게 따라올 수 있도록 안내합니다.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {facilities.map((item, index) => (
              <div
                key={item.title}
                className="group rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-100"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white group-hover:bg-cyan-500">
                  {String(index + 1).padStart(2, "0")}
                </div>

                <h3 className="mt-7 text-xl font-black text-slate-950">
                  {item.title}
                </h3>

                <p className="mt-4 text-sm leading-7 text-slate-500">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
        
        <FacilityPhotos />

      <section className="relative overflow-hidden bg-slate-950 px-4 py-24 text-white sm:px-6 lg:px-8 lg:py-32">
        <Image
          src="/images/about/about-ocean.jpg"
          alt="Jeju Seongsan Ocean"
          fill
          className="object-cover"
        />

        <div className="absolute inset-0 bg-slate-950/75" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />

        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_420px] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.35em] text-cyan-100 backdrop-blur">
              <MapPin className="h-4 w-4" />
              Seongsan, Jeju
            </p>

            <h2 className="mt-7 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              제주 동쪽,
              <span className="block text-cyan-300">성산 바다에서 만나요</span>
            </h2>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              성산권 다이빙 포인트는 맑은 바다색, 제주 특유의 화산암 지형,
              다양한 해양 생물을 함께 만날 수 있는 매력적인 지역입니다.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/10 p-7 shadow-2xl shadow-black/30 backdrop-blur">
            <Award className="h-10 w-10 text-cyan-300" />

            <p className="mt-6 text-2xl font-black text-white">
              체험, 펀다이빙, 교육까지
            </p>

            <p className="mt-4 text-sm leading-7 text-slate-300">
              처음 다이빙하는 분부터 자격증 보유 다이버, 교육을 시작하려는
              분까지 성산 바다에서 자신에게 맞는 다이빙을 경험할 수 있습니다.
            </p>

            <Link
              href="/reservation"
              className="mt-7 inline-flex h-14 items-center justify-center gap-3 rounded-full bg-cyan-300 px-7 text-sm font-black text-slate-950 transition hover:bg-white"
            >
              예약 문의하기
              <ArrowRight className="h-5 w-5" />
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

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/70">
      <p className="text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-2 text-sm font-bold text-slate-500">{label}</p>
    </div>
  );
}