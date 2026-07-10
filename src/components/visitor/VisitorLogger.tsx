"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

function shouldIgnorePath(pathname: string) {
  return (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  );
}

export default function VisitorLogger() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || shouldIgnorePath(pathname)) {
      return;
    }

    const logKey = `visitor-log:${pathname}`;
    const now = Date.now();
    const lastLoggedAt = Number(sessionStorage.getItem(logKey) || 0);

    if (now - lastLoggedAt < 3000) {
      return;
    }

    sessionStorage.setItem(logKey, String(now));

    fetch("/api/visitor-logs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      keepalive: true,
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer || undefined,
      }),
    }).catch(() => {
      // 방문 로그 실패는 사용자 화면에 영향을 주지 않습니다.
    });
  }, [pathname]);

  return null;
}