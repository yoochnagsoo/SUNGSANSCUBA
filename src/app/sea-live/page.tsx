import Link from "next/link";

import SeaLivePlayer from "@/components/sea-live/SeaLivePlayer";
import SeaConditionsPanel from "@/components/sea-live/SeaConditionsPanel";
import { SEA_LIVE_STREAM_URL } from "@/lib/seaLive";

const streamPath = `/api/sea-live/proxy?url=${encodeURIComponent(
  SEA_LIVE_STREAM_URL,
)}`;

export default function SeaLivePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black text-cyan-300">
              SUNG SAN SCUBA LIVE
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              오늘의 바다 상황
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              수마포구 실시간 CCTV로 체험 다이빙 진행 해역의 현재
              상황을 확인하세요.
            </p>
          </div>

          <Link
            href="/reservation"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-cyan-500 px-5 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
          >
            예약하기
          </Link>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <SeaLivePlayer streamPath={streamPath} />
          <SeaConditionsPanel />
        </div>

        <p className="mt-4 text-xs font-semibold leading-5 text-slate-400">
          본 영상은 외부 CCTV 스트림을 기반으로 제공되며, 현장 장비 또는
          네트워크 사정에 따라 일시적으로 지연되거나 중단될 수 있습니다.
        </p>
      </section>
    </main>
  );
}
