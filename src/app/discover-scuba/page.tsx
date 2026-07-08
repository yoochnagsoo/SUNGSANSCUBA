import Image from "next/image";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Users,
  Waves,
} from "lucide-react";

const steps = [
  "센터 도착 및 신청서 작성",
  "장비 착용 및 안전 브리핑",
  "얕은 수심에서 호흡 연습",
  "강사와 함께 체험다이빙 진행 & 사진촬영",
  "샤워/정리",
];

const includes = [
  "전문 강사 동행",
  "다이빙 장비 일체",
  "안전 브리핑",
  "수중 적응 교육",
  "샤워 시설 이용",
];

export default function DiscoverScubaPage() {
  return (
    <main className="bg-white">
      <section className="relative h-[520px] overflow-hidden bg-slate-950 text-white">
        <Image
          src="/images/courses/discover.jpg"
          alt="SUNGSAN SCUBA 체험다이빙"
          fill
          priority
          className="object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/50 to-transparent" />

        <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-6">
          <div className="max-w-3xl">
            <p className="mb-5 text-sm font-bold uppercase tracking-[0.45em] text-sky-300">
              Discover Scuba Diving
            </p>
            <h1 className="text-5xl font-black leading-tight md:text-7xl">
              제주 성산에서
              <br />
              첫 다이빙을 시작하세요
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-9 text-slate-200">
              수영을 잘하지 못해도 괜찮습니다. 전문 강사가 함께 동행하며
              안전하게 바닷속을 경험할 수 있는 입문 프로그램입니다.
            </p>
            <a
              href="/reservation"
              className="mt-10 inline-flex items-center gap-4 rounded-full bg-sky-400 px-9 py-4 font-bold text-slate-950 transition hover:bg-white"
            >
              체험다이빙 예약하기
              <ArrowRight size={20} />
            </a>
          </div>
        </div>
      </section>

      <section className="py-24">
  <div className="mx-auto grid max-w-7xl gap-6 px-6 md:grid-cols-2 lg:grid-cols-4">
    {[
      {
        icon: Clock,
        label: "Duration",
        title: "약 1~2시간",
        desc: "브리핑 + 장비착용 + 체험다이빙",
      },
      {
        icon: Users,
        label: "Group",
        title: "소규모 진행",
        desc: "강사 1명당 안전 중심 케어",
      },
      {
        icon: Waves,
        label: "Depth",
        title: "얕은 수심부터",
        desc: "초보자도 천천히 적응 가능",
      },
      {
        icon: ShieldCheck,
        label: "Safety",
        title: "강사 동행",
        desc: "전 과정 전문 강사와 함께 진행",
      },
    ].map((item) => {
      const Icon = item.icon;

      return (
        <div
          key={item.label}
          className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-lg transition duration-300 hover:-translate-y-2 hover:border-sky-300 hover:shadow-2xl"
        >
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100">
            <Icon className="text-sky-600" size={34} />
          </div>

          <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-600">
            {item.label}
          </p>

          <h3 className="mt-3 text-3xl font-black text-slate-900">
            {item.title}
          </h3>

          <p className="mt-3 leading-7 text-slate-500">
            {item.desc}
          </p>
        </div>
      );
    })}
  </div>
</section>

      <section className="bg-slate-50 py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-6 lg:grid-cols-2">
          <div>
            <p className="mb-5 text-sm font-bold uppercase tracking-[0.45em] text-sky-500">
              For Beginners
            </p>
            <h2 className="text-4xl font-black leading-tight text-slate-950 md:text-6xl">
              처음이어도
              <br />
              충분히 즐길 수 있습니다
            </h2>
            <p className="mt-8 text-lg leading-9 text-slate-600">
              체험다이빙은 자격증이 없는 분들도 참여할 수 있는 프로그램입니다.
              다이빙 장비 사용법, 물속 호흡 방법, 기본 안전 수칙을 배운 뒤
              강사와 함께 천천히 바닷속으로 들어갑니다.
            </p>
          </div>

          <div className="relative h-[560px] overflow-hidden rounded-[40px] shadow-2xl">
            <Image
              src="/images/about/about-01.jpg"
              alt="체험다이빙 브리핑"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 text-center">
            <p className="mb-4 text-sm font-bold uppercase tracking-[0.45em] text-sky-500">
              Program Flow
            </p>
            <h2 className="text-4xl font-black text-slate-950 md:text-6xl">
              진행 순서
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-5">
            {steps.map((step, index) => (
              <div
                key={step}
                className="rounded-[28px] border border-slate-200 bg-white p-7 shadow-lg"
              >
                <p className="text-4xl font-black text-sky-500">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <p className="mt-5 font-bold leading-7 text-slate-800">
                  {step}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-28 text-white">
        <div className="mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-2">
          <div>
            <p className="mb-5 text-sm font-bold uppercase tracking-[0.45em] text-sky-300">
              Included
            </p>
            <h2 className="text-4xl font-black leading-tight md:text-6xl">
              프로그램 포함 사항
            </h2>
            <p className="mt-8 text-lg leading-9 text-slate-300">
              체험다이빙에 필요한 기본 장비와 안전 교육이 포함됩니다.
              개인 준비물은 수영복, 수건, 세면도구 정도면 충분합니다.
            </p>
          </div>

          <div className="grid gap-4">
            {includes.map((item) => (
              <div
                key={item}
                className="flex items-center gap-4 rounded-2xl bg-white/10 p-5 backdrop-blur"
              >
                <CheckCircle2 className="text-sky-300" />
                <p className="font-bold">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-28">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="mb-5 text-sm font-bold uppercase tracking-[0.45em] text-sky-500">
            Ready?
          </p>
          <h2 className="text-4xl font-black leading-tight text-slate-950 md:text-6xl">
            지금, 제주 성산의 바다를
            <br />
            만나보세요
          </h2>
          <p className="mx-auto mt-8 max-w-2xl text-lg leading-9 text-slate-600">
            일정과 인원을 알려주시면 가장 적합한 체험다이빙 일정을
            안내해드립니다.
          </p>
          <a
            href="/reservation"
            className="mt-10 inline-flex items-center gap-4 rounded-full bg-sky-500 px-10 py-5 font-black text-white transition hover:bg-slate-950"
          >
            예약하기
            <ArrowRight size={20} />
          </a>
        </div>
      </section>
    </main>
  );
}