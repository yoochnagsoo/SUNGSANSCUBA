import Image from "next/image";
import { ArrowRight, ShieldCheck, Waves, Users } from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Safety First",
    desc: "국제 기준의 안전 절차와 장비 점검으로 처음 다이빙도 안심할 수 있습니다.",
  },
  {
    icon: Waves,
    title: "Jeju Ocean",
    desc: "성산의 맑은 바다와 아름다운 수중 포인트를 가장 가까이에서 경험합니다.",
  },
  {
    icon: Users,
    title: "Small Group",
    desc: "소규모 그룹 운영으로 한 명 한 명에게 집중하는 프리미엄 케어를 제공합니다.",
  },
];

export default function AboutSection() {
  return (
    <section className="bg-white py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-20 lg:grid-cols-2">
          <div>
            <p className="mb-5 text-sm font-bold uppercase tracking-[0.45em] text-sky-500">
              About SUNGSAN SCUBA
            </p>

            <h2 className="text-5xl font-black leading-tight text-slate-950 md:text-6xl">
              제주 성산의 바다를
              <br />
              가장 아름답게
              <br />
              경험하는 방법
            </h2>

            <p className="mt-8 max-w-2xl text-lg leading-9 text-slate-600">
              SUNGSAN SCUBA Dive Center는 제주 성산의 아름다운 바다에서
              체험다이빙, PADI 교육, 펀다이빙을 제공하는 프리미엄 다이빙
              센터입니다. 처음 바다를 만나는 순간부터 자격증 교육까지,
              안전하고 특별한 경험을 만들어 드립니다.
            </p>

            <div className="mt-10 grid gap-5">
              {features.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="flex gap-5 rounded-3xl border border-slate-200 p-6 transition hover:border-sky-400 hover:shadow-xl"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
                      <Icon size={28} />
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-slate-950">
                        {item.title}
                      </h3>
                      <p className="mt-2 leading-7 text-slate-500">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <a
              href="/about"
              className="mt-12 inline-flex items-center gap-4 rounded-full bg-slate-950 px-8 py-4 font-bold text-white transition hover:bg-sky-500"
            >
              센터 소개 보기
              <ArrowRight size={20} />
            </a>
          </div>

          <div className="relative">
            <div className="relative h-[620px] overflow-hidden rounded-[44px] shadow-2xl">
              <Image
                src="/images/about/about-01.jpg"
                alt="SUNGSAN SCUBA Dive Center"
                fill
                className="object-cover"
              />
            </div>

            <div className="absolute -bottom-8 left-8 rounded-3xl bg-white/90 p-8 shadow-2xl backdrop-blur">
              <p className="text-5xl font-black text-sky-500">10+</p>
              <p className="mt-2 font-bold text-slate-950">
                Years Experience
              </p>
              <p className="mt-1 text-sm text-slate-500">
                제주 성산 다이빙 경험
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}