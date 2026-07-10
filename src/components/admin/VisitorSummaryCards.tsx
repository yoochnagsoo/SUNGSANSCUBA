"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type VisitorDeviceType = "MOBILE" | "TABLET" | "DESKTOP" | "UNKNOWN";

type VisitorLogSummaryRecentLog = {
  id: string;
  path: string;
  referrer?: string;
  deviceType: VisitorDeviceType;
  visitedAt: string;
  visitedDate: string;
  createdAt: string;
};

type VisitorLogSummary = {
  totalVisits: number;
  todayVisits: number;
  todayUniqueVisitors: number;
  monthVisits: number;
  monthUniqueVisitors: number;
  reservationPageVisits: number;
  mobileVisits: number;
  tabletVisits: number;
  desktopVisits: number;
  unknownDeviceVisits: number;
  topPages: Array<{
    path: string;
    count: number;
  }>;
  recentLogs: VisitorLogSummaryRecentLog[];
};

type VisitorSummaryResponse = {
  ok: boolean;
  summary?: VisitorLogSummary;
  message?: string;
};

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getDeviceLabel(deviceType: VisitorDeviceType) {
  if (deviceType === "MOBILE") {
    return "모바일";
  }

  if (deviceType === "TABLET") {
    return "태블릿";
  }

  if (deviceType === "DESKTOP") {
    return "PC";
  }

  return "기타";
}

function getPercent(value: number, total: number) {
  if (!total) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

export default function VisitorSummaryCards() {
  const [summary, setSummary] = useState<VisitorLogSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function fetchVisitorSummary() {
    try {
      setLoading(true);
      setErrorMessage("");

      const res = await fetch("/api/admin/visitor-logs/summary", {
        cache: "no-store",
      });

      const data = (await res.json()) as VisitorSummaryResponse;

      if (!res.ok || !data.ok || !data.summary) {
        throw new Error(data.message || "방문자 통계를 불러오지 못했습니다.");
      }

      setSummary(data.summary);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "방문자 통계를 불러오지 못했습니다.";

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchVisitorSummary();
  }, []);

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-slate-500">
          방문자 통계를 불러오는 중입니다.
        </p>
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
        <p className="text-sm font-bold text-red-700">{errorMessage}</p>
      </section>
    );
  }

  if (!summary) {
    return null;
  }

  const totalDeviceVisits =
    summary.mobileVisits +
    summary.tabletVisits +
    summary.desktopVisits +
    summary.unknownDeviceVisits;

  const mobilePercent = getPercent(summary.mobileVisits, totalDeviceVisits);
  const tabletPercent = getPercent(summary.tabletVisits, totalDeviceVisits);
  const desktopPercent = getPercent(summary.desktopVisits, totalDeviceVisits);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">방문 로그</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">
            방문자 통계
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={fetchVisitorSummary}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            새로고침
          </button>

          <Link
            href="/admin/visitor-logs"
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
          >
            상세보기
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <p className="text-sm font-bold text-blue-700">오늘 방문수</p>
          <p className="mt-3 text-3xl font-black text-blue-950">
            {summary.todayVisits.toLocaleString()}
          </p>
          <p className="mt-1 text-xs font-semibold text-blue-700">
            순방문자 {summary.todayUniqueVisitors.toLocaleString()}명
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
          <p className="text-sm font-bold text-emerald-700">이번 달 방문수</p>
          <p className="mt-3 text-3xl font-black text-emerald-950">
            {summary.monthVisits.toLocaleString()}
          </p>
          <p className="mt-1 text-xs font-semibold text-emerald-700">
            순방문자 {summary.monthUniqueVisitors.toLocaleString()}명
          </p>
        </div>

        <div className="rounded-2xl border border-purple-100 bg-purple-50 p-5">
          <p className="text-sm font-bold text-purple-700">전체 방문수</p>
          <p className="mt-3 text-3xl font-black text-purple-950">
            {summary.totalVisits.toLocaleString()}
          </p>
          <p className="mt-1 text-xs font-semibold text-purple-700">
            누적 방문 로그
          </p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
          <p className="text-sm font-bold text-amber-700">예약 페이지</p>
          <p className="mt-3 text-3xl font-black text-amber-950">
            {summary.reservationPageVisits.toLocaleString()}
          </p>
          <p className="mt-1 text-xs font-semibold text-amber-700">
            /reservation 방문
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-bold text-slate-700">기기 비율</p>
          <p className="mt-3 text-sm font-black text-slate-900">
            PC {desktopPercent}% · 모바일 {mobilePercent}% · 태블릿{" "}
            {tabletPercent}%
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full bg-slate-900"
              style={{ width: `${desktopPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                인기 페이지
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                방문 로그 기준 상위 페이지입니다.
              </p>
            </div>

            <Link
              href="/admin/visitor-logs"
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              전체 보기
            </Link>
          </div>

          <div className="mt-4 space-y-2">
            {summary.topPages.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                아직 방문 기록이 없습니다.
              </div>
            ) : (
              summary.topPages.map((page, index) => (
                <div
                  key={page.path}
                  className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-400">
                      #{index + 1}
                    </p>
                    <p className="mt-1 truncate text-sm font-bold text-slate-900">
                      {page.path}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700">
                    {page.count.toLocaleString()}회
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                최근 방문 로그
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                IP 원문과 visitorHash는 표시하지 않습니다.
              </p>
            </div>

            <Link
              href="/admin/visitor-logs"
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              상세
            </Link>
          </div>

          <div className="mt-4 max-h-[360px] space-y-2 overflow-y-auto pr-1">
            {summary.recentLogs.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                아직 최근 방문 기록이 없습니다.
              </div>
            ) : (
              summary.recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-black text-slate-900">
                      {log.path}
                    </p>
                    <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[11px] font-bold text-slate-600">
                      {getDeviceLabel(log.deviceType)}
                    </span>
                  </div>

                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    {formatDateTime(log.visitedAt)}
                  </p>

                  {log.referrer ? (
                    <p className="mt-1 truncate text-xs text-slate-400">
                      유입: {log.referrer}
                    </p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}