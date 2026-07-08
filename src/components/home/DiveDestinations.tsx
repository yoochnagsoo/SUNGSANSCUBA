"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  CalendarDays,
  Fish,
  Star,
  Thermometer,
  Waves,
} from "lucide-react";

const destinations = [
  {
    name: "섬여",
    en: "Seongsan Port",
    image: "/images/destinations/seongsan-port.jpg",
    level: "Beginner ~ Advanced",
    temperature: "18~27℃",
    visibility: "10~30m",
    season: "3월 ~ 11월",
    life: ["자리돔", "돌돔", "문어", "연산호"],
    description:
      "성산 앞바다의 대표 포인트로 초보 체험다이빙부터 펀다이빙까지 폭넓게 즐길 수 있습니다.",
  },
  {
    name: "불상",
    en: "Udo Island",
    image: "/images/destinations/bulsang.jpg",
    level: "Beginner ~ Intermediate",
    temperature: "19~27℃",
    visibility: "8~25m",
    season: "4월 ~ 10월",
    life: ["자리돔", "소라", "해조류", "산호"],
    description:
      "맑은 수중 시야와 완만한 지형으로 처음 바다를 만나는 분들에게도 좋은 포인트입니다.",
  },
  {
    name: "자리여",
    en: "Seopjikoji",
    image: "/images/destinations/seopjikoji.jpg",
    level: "Intermediate",
    temperature: "18~26℃",
    visibility: "10~25m",
    season: "4월 ~ 11월",
    life: ["돌돔", "놀래기", "문어", "해삼"],
    description:
      "제주 특유의 화산암 지형과 다양한 해양생물을 함께 볼 수 있는 성산권 포인트입니다.",
  },
  {
    name: "독립문",
    en: "Munseom",
    image: "/images/destinations/munseom.jpg",
    level: "Intermediate ~ Advanced",
    temperature: "18~28℃",
    visibility: "10~30m",
    season: "연중 가능",
    life: ["연산호", "자리돔", "부시리", "돌돔"],
    description:
      "제주를 대표하는 다이빙 포인트 중 하나로 풍부한 산호와 어군을 경험할 수 있습니다.",
  },
  {
    name: "인공어초",
    en: "Munseom",
    image: "/images/destinations/munseom2.jpg",
    level: "Intermediate ~ Advanced",
    temperature: "18~28℃",
    visibility: "10~30m",
    season: "연중 가능",
    life: ["연산호", "자리돔", "부시리", "돌돔"],
    description:
      "제주를 대표하는 다이빙 포인트 중 하나로 풍부한 산호와 어군을 경험할 수 있습니다.",
  },
];

export default function DiveDestinations() {
  const [active, setActive] = useState(0);
  const current = destinations[active];

  return (
    <section className="bg-white py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-14 text-center">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.45em] text-sky-500">
            Jeju Dive Destinations
          </p>

          <h2 className="text-4xl font-black text-slate-950 md:text-6xl">
            제주 성산의 대표 다이빙 포인트
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-500">
            SUNGSAN SCUBA가 안내하는 제주 동부권의 아름다운 바다를
            만나보세요.
          </p>
        </div>

        <div className="mb-10 flex flex-wrap justify-center gap-3">
          {destinations.map((site, index) => (
            <button
              key={site.name}
              onClick={() => setActive(index)}
              className={`rounded-full px-6 py-3 text-sm font-bold transition ${
                active === index
                  ? "bg-slate-950 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-sky-100 hover:text-sky-700"
              }`}
            >
              {site.name}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-[44px] bg-slate-950 shadow-2xl">
          <div className="grid lg:grid-cols-2">
            <div className="relative h-[420px] lg:h-[620px]">
              <Image
                key={current.image}
                src={current.image}
                alt={current.name}
                fill
                className="object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent lg:hidden" />

              <div className="absolute bottom-8 left-8 text-white lg:hidden">
                <p className="text-sm uppercase tracking-[0.3em] text-sky-300">
                  {current.en}
                </p>
                <h3 className="mt-2 text-4xl font-black">{current.name}</h3>
              </div>
            </div>

            <div className="flex flex-col justify-center p-8 text-white md:p-12 lg:p-16">
              <p className="mb-4 text-sm font-bold uppercase tracking-[0.35em] text-sky-300">
                {current.en}
              </p>

              <h3 className="text-5xl font-black">{current.name}</h3>

              <div className="mt-5 flex items-center gap-2 text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={20} fill="currentColor" />
                ))}
                <span className="ml-3 text-sm font-semibold text-slate-300">
                  {current.level}
                </span>
              </div>

              <p className="mt-8 text-lg leading-9 text-slate-300">
                {current.description}
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/10 p-5">
                  <Thermometer className="mb-3 text-sky-300" />
                  <p className="text-sm text-slate-400">수온</p>
                  <p className="mt-1 font-bold">{current.temperature}</p>
                </div>

                <div className="rounded-2xl bg-white/10 p-5">
                  <Waves className="mb-3 text-sky-300" />
                  <p className="text-sm text-slate-400">시야</p>
                  <p className="mt-1 font-bold">{current.visibility}</p>
                </div>

                <div className="rounded-2xl bg-white/10 p-5">
                  <CalendarDays className="mb-3 text-sky-300" />
                  <p className="text-sm text-slate-400">추천시기</p>
                  <p className="mt-1 font-bold">{current.season}</p>
                </div>
              </div>

              <div className="mt-8">
                <p className="mb-3 text-sm font-bold uppercase tracking-[0.25em] text-slate-400">
                  Marine Life
                </p>

                <div className="flex flex-wrap gap-3">
                  {current.life.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-slate-200"
                    >
                      <Fish size={16} className="text-sky-300" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <a
                href="/reservation"
                className="mt-10 inline-flex w-fit items-center gap-4 rounded-full bg-sky-400 px-8 py-4 font-bold text-slate-950 transition hover:bg-white"
              >
                이 포인트 예약하기
                <ArrowRight size={20} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}