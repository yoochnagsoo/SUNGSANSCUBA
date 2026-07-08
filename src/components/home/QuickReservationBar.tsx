import { CalendarDays, Users, Waves, ArrowRight } from "lucide-react";

export default function QuickReservationBar() {
  return (
    <section className="relative z-30 -mt-10 px-6">
      <div className="mx-auto max-w-6xl rounded-[32px] bg-white p-5 shadow-2xl">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-5">
            <CalendarDays className="text-sky-500" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                Date
              </p>
              <p className="mt-1 font-bold text-slate-950">날짜 선택</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-5">
            <Users className="text-sky-500" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                People
              </p>
              <p className="mt-1 font-bold text-slate-950">인원 선택</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-5">
            <Waves className="text-sky-500" />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                Program
              </p>
              <p className="mt-1 font-bold text-slate-950">체험다이빙</p>
            </div>
          </div>

          <a
            href="/reservation"
            className="flex items-center justify-center gap-3 rounded-2xl bg-sky-500 p-5 font-black text-white transition hover:bg-slate-950"
          >
            예약하기
            <ArrowRight size={20} />
          </a>
        </div>
      </div>
    </section>
  );
}