import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

function InstagramIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle
        cx="12"
        cy="12"
        r="4"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" />
    </svg>
  );
}

const NAVER_MAP_URL =
  "https://map.naver.com/p/search/%EC%84%B1%EC%82%B0%EC%8A%A4%EC%BF%A0%EB%B2%84/place/32278847?c=15.00,0,0,2,dh&placePath=%2Fhome%3Fbk_query%3D%EC%84%B1%EC%82%B0%EC%8A%A4%EC%BF%A0%EB%B2%84%26entry%3Dbmp%26from%3Dmap%26fromPanelNum%3D2%26timestamp%3D202607100206%26locale%3Dko%26svcName%3Dmap_pcv5%26searchText%3D%EC%84%B1%EC%82%B0%EC%8A%A4%EC%BF%A0%EB%B2%84";

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
                href="https://www.instagram.com/sungsanscuba"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 transition hover:bg-pink-500"
              >
                <InstagramIcon size={20} />
              </a>

              <a
                href={NAVER_MAP_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="네이버 지도에서 성산스쿠버 보기"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#03c75a] text-lg font-black text-white transition hover:bg-[#02b351]"
              >
                N
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-6 text-lg font-black">CONTACT</h3>

            <div className="space-y-5 text-slate-300">
              <p className="flex gap-3">
                <MapPin className="shrink-0 text-sky-400" size={20} />
                제주 서귀포시 성산읍 일출로 258-5 성산스쿠버리조트
              </p>

              <a
                href="tel:064-782-6117"
                className="flex gap-3 transition hover:text-sky-400"
              >
                <Phone className="shrink-0 text-sky-400" size={20} />
                064-782-6117
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