import Image from "next/image";
import { ArrowRight, MessageCircle, Phone } from "lucide-react";

export default function ReservationCTA() {
  return (
    <section className="relative overflow-hidden bg-slate-950 py-32 text-white">
      <Image
        src="/images/cta/cta-01.jpg"
        alt="SEONG SAN SCUBA reservation"
        fill
        className="object-cover opacity-45"
      />

      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-slate-950/30" />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="max-w-3xl">
          <p className="mb-5 text-sm font-bold uppercase tracking-[0.45em] text-sky-300">
            Book Your Dive
          </p>

          <h2 className="text-5xl font-black leading-tight md:text-7xl">
            제주 성산에서
            <br />
            첫 다이빙을 시작하세요
          </h2>

          <p className="mt-8 max-w-2xl text-lg leading-9 text-slate-200">
            체험다이빙, PADI 교육, 펀다이빙 예약을 도와드립니다.
            일정과 인원을 알려주시면 가장 적합한 프로그램을 안내해드립니다.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <a
              href="/reservation"
              className="inline-flex items-center gap-4 rounded-full bg-sky-400 px-9 py-4 font-bold text-slate-950 transition hover:bg-white"
            >
              예약하기
              <ArrowRight size={20} />
            </a>

            <a
              href="tel:064-782-6117"
              className="inline-flex items-center gap-3 rounded-full border border-white/50 px-8 py-4 font-bold transition hover:bg-white hover:text-slate-950"
            >
              <Phone size={20} />
              전화문의
            </a>

            <a
              href="http://pf.kakao.com/_xcYwCM/chat"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-full border border-white/50 px-8 py-4 font-bold transition hover:bg-white hover:text-slate-950"
            >
              <MessageCircle size={20} />
              카카오톡
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
