import { Camera, Globe, Mail, MapPin, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="text-3xl font-black tracking-[0.18em]">
              SUNGSAN
            </div>
            <div className="mt-1 text-3xl font-black tracking-[0.22em]">
              SCUBA
            </div>
            <p className="mt-2 text-xs tracking-[0.45em] text-slate-400">
              DIVE CENTER
            </p>

            <p className="mt-8 max-w-xl leading-8 text-slate-300">
              제주 성산의 아름다운 바다에서 체험다이빙, PADI 교육,
              펀다이빙을 제공하는 프리미엄 다이빙 센터입니다.
            </p>

            <div className="mt-8 flex gap-3">
              <a
                href="#"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 transition hover:bg-sky-500"
              >
                <Camera size={20} />
              </a>

              <a
                href="#"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 transition hover:bg-sky-500"
              >
                <Globe  size={20} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-6 text-lg font-black">CONTACT</h3>

            <div className="space-y-5 text-slate-300">
              <p className="flex gap-3">
                <MapPin className="shrink-0 text-sky-400" size={20} />
                제주특별자치도 서귀포시 성산읍
              </p>

              <p className="flex gap-3">
                <Phone className="shrink-0 text-sky-400" size={20} />
                010-0000-0000
              </p>

              <p className="flex gap-3">
                <Mail className="shrink-0 text-sky-400" size={20} />
                info@sungsanscuba.com
              </p>
            </div>
          </div>

          <div>
            <h3 className="mb-6 text-lg font-black">MENU</h3>

            <div className="grid gap-3 text-slate-300">
              <a href="/about" className="hover:text-sky-400">
                센터소개
              </a>
              <a href="/destinations" className="hover:text-sky-400">
                다이빙 포인트
              </a>
              <a href="/courses" className="hover:text-sky-400">
                PADI 교육
              </a>
              <a href="/gallery" className="hover:text-sky-400">
                갤러리
              </a>
              <a href="/reservation" className="hover:text-sky-400">
                예약하기
              </a>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-white/10 pt-8 text-sm text-slate-500">
          © 2026 SUNGSAN SCUBA Dive Center. All rights reserved.
        </div>
      </div>
    </footer>
  );
}