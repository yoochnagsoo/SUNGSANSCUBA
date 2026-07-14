import { Award, ShieldCheck, Users, Waves } from "lucide-react";

const items = [
  {
    icon: Award,
    title: "PADI Standard",
    desc: "국제 기준에 맞춘 체계적인 교육",
  },
  {
    icon: ShieldCheck,
    title: "Safety System",
    desc: "장비 점검과 안전 브리핑 우선",
  },
  {
    icon: Users,
    title: "Small Group",
    desc: "소규모 인원으로 집중 케어",
  },
  {
    icon: Waves,
    title: "Seongsan Ocean",
    desc: "제주 성산 바다 전문 다이빙",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="bg-slate-950 py-28 text-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 text-center">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.45em] text-sky-300">
            Why Choose Us
          </p>

          <h2 className="text-4xl font-black md:text-6xl">
            처음이라도 안심할 수 있는 이유
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            SEONG SAN SCUBA는 안전, 교육, 경험, 지역 전문성을 기준으로
            다이빙을 준비합니다.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-[32px] border border-white/10 bg-white/10 p-8 backdrop-blur transition hover:-translate-y-2 hover:bg-white/15"
              >
                <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-400/20 text-sky-300">
                  <Icon size={32} />
                </div>

                <h3 className="text-2xl font-bold">{item.title}</h3>

                <p className="mt-4 leading-7 text-slate-300">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}