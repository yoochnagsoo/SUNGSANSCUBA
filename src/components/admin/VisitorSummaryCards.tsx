"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
};

type VisitorSummaryResponse = {
  ok: boolean;
  summary?: VisitorLogSummary;
  message?: string;
};

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
  const unknownPercent = getPercent(
    summary.unknownDeviceVisits,
    totalDeviceVisits,
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
        
          <h2 className="mt-1 text-xl font-bold text-slate-900">
            홈페이지 방문자 통계
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

          <p className="mt-2 text-xs font-semibold text-slate-500">
            기타 {unknownPercent}% 포함
          </p>
        </div>
      </div>
    </section>
  );
}