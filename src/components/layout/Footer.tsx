import Link from "next/link";
import { Camera, Globe, Mail, MapPin, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link href="/" aria-label="Sungsan Scuba 메인으로 이동">
              <div className="text-3xl font-black tracking-[0.18em]">
                SUNGSAN
              </div>
              <div className="mt-1 text-3xl font-black tracking-[0.22em]">
                SCUBA
              </div>
              <p className="mt-2 text-xs tracking-[0.45em] text-slate-400">
                DIVE CENTER
              </p>
            </Link>

            <p className="mt-8 max-w-xl leading-8 text-slate-300">
              제주 성산의 아름다운 바다에서 체험다이빙, PADI 교육,
              펀다이빙을 제공하는 프리미엄 다이빙 센터입니다.
            </p>

            <div className="mt-8 flex gap-3">
              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 transition hover:bg-sky-500"
              >
                <Camera size={20} />
              </a>

              <Link
                href="/"
                aria-label="Sungsan Scuba website"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 transition hover:bg-sky-500"
              >
                <Globe size={20} />
              </Link>
            </div>
          </div>

          <div>
            <h3 className="mb-6 text-lg font-black">CONTACT</h3>

            <div className="space-y-5 text-slate-300">
              <p className="flex gap-3">
                <MapPin className="shrink-0 text-sky-400" size={20} />
                제주특별자치도 서귀포시 성산읍
              </p>

              <a
                href="tel:010-0000-0000"
                className="flex gap-3 transition hover:text-sky-400"
              >
                <Phone className="shrink-0 text-sky-400" size={20} />
                010-0000-0000
              </a>

              <a
                href="mailto:info@sungsanscuba.com"
                className="flex gap-3 transition hover:text-sky-400"
              >
                <Mail className="shrink-0 text-sky-400" size={20} />
                info@sungsanscuba.com
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-6 text-lg font-black">MENU</h3>

            <div className="grid gap-3 text-slate-300">
              <Link href="/about" className="transition hover:text-sky-400">
                센터소개
              </Link>

              

              <Link href="/padi" className="transition hover:text-sky-400">
                PADI 교육
              </Link>

              <Link href="/gallery" className="transition hover:text-sky-400">
                갤러리
              </Link>

              <Link
                href="/reservation"
                className="transition hover:text-sky-400"
              >
                예약하기
              </Link>
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