"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "수영을 못해도 체험다이빙이 가능한가요?",
    a: "네, 가능합니다. 체험다이빙은 전문 강사가 함께 동행하며 얕은 수심에서 천천히 적응한 뒤 진행합니다.",
  },
  {
    q: "준비물은 무엇인가요?",
    a: "수영복, 수건, 개인 세면도구 정도만 준비하시면 됩니다. 기본 다이빙 장비는 센터에서 제공합니다.",
  },
  {
    q: "PADI 교육은 며칠 정도 걸리나요?",
    a: "Open Water 과정은 보통 2~3일 정도 소요됩니다. 일정은 예약 상황과 바다 컨디션에 따라 조정됩니다.",
  },
  {
    q: "날씨가 안 좋으면 어떻게 되나요?",
    a: "안전을 최우선으로 판단하며, 기상 악화 시 일정 변경 또는 환불 규정에 따라 안내드립니다.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="bg-slate-50 py-32">
      <div className="mx-auto max-w-4xl px-6">
        <div className="mb-14 text-center">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.45em] text-sky-500">
            FAQ
          </p>

          <h2 className="text-4xl font-black text-slate-950 md:text-6xl">
            자주 묻는 질문
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-500">
            SEONG SAN SCUBA 이용 전 가장 많이 궁금해하시는 내용을 정리했습니다.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((item, index) => {
            const isOpen = open === index;

            return (
              <div
                key={item.q}
                className="overflow-hidden rounded-3xl bg-white shadow-lg"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-6 px-8 py-7 text-left"
                >
                  <span className="text-lg font-black text-slate-950">
                    {item.q}
                  </span>

                  <ChevronDown
                    className={`shrink-0 text-sky-500 transition ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-8 pb-8 text-lg leading-8 text-slate-600">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}