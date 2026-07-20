"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

export default function RenewalNoticePopup() {
  const pathname = usePathname();
  const hasShownRef = useRef(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pathname?.startsWith("/admin")) {
      setVisible(false);
      return;
    }

    if (hasShownRef.current) {
      return;
    }

    hasShownRef.current = true;
    setVisible(true);
  }, [pathname]);

  function handleClose() {
    setVisible(false);
  }

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="renewal-notice-title"
        className="relative w-full max-w-md overflow-hidden rounded-[1.75rem] border border-white/20 bg-white shadow-2xl shadow-slate-950/30"
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="안내 팝업 닫기"
          className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-950"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="bg-gradient-to-br from-cyan-600 to-blue-700 px-6 pb-7 pt-10 text-white">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-100">
            Notice
          </p>
          <h2
            id="renewal-notice-title"
            className="mt-3 pr-12 text-2xl font-black leading-tight"
          >
            성산스쿠버 홈페이지 리뉴얼 안내
          </h2>
        </div>

        <div className="px-6 py-6">
          <p className="text-base font-bold leading-7 text-slate-800">
            현재 홈페이지는 더 나은 예약과 안내 서비스를 위해 리뉴얼 중입니다.
          </p>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            일부 화면이나 기능이 조정 중일 수 있습니다. 예약 및 문의는 정상적으로
            접수되며, 불편한 점은 성산스쿠버로 연락해주세요.
          </p>

          <button
            type="button"
            onClick={handleClose}
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-blue-700"
          >
            확인했습니다
          </button>
        </div>
      </div>
    </div>
  );
}
