"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type VisitorDeviceType = "MOBILE" | "TABLET" | "DESKTOP" | "UNKNOWN";

type VisitorLog = {
  id: string;
  path: string;
  referrer?: string;
  deviceType: VisitorDeviceType;
  visitedAt: string;
  visitedDate: string;
  createdAt: string;
};

type VisitorLogsResponse = {
  ok: boolean;
  visitorLogs?: VisitorLog[];
  message?: string;
};

const DEVICE_LABEL: Record<VisitorDeviceType, string> = {
  MOBILE: "모바일",
  TABLET: "태블릿",
  DESKTOP: "PC",
  UNKNOWN: "기타",
};

const DEVICE_STYLE: Record<VisitorDeviceType, string> = {
  MOBILE: "bg-blue-50 text-blue-700 ring-blue-200",
  TABLET: "bg-purple-50 text-purple-700 ring-purple-200",
  DESKTOP: "bg-slate-100 text-slate-700 ring-slate-200",
  UNKNOWN: "bg-amber-50 text-amber-700 ring-amber-200",
};

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

function getTodayKey() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(new Date());
}

function getMonthKey() {
  return getTodayKey().slice(0, 7);
}

function sortRecentLogs(logs: VisitorLog[]) {
  return [...logs].sort((a, b) => b.visitedAt.localeCompare(a.visitedAt));
}

function getTopPages(logs: VisitorLog[]) {
  const map = new Map<string, number>();

  for (const log of logs) {
    map.set(log.path, (map.get(log.path) || 0) + 1);
  }

  return [...map.entries()]
    .map(([path, count]) => ({
      path,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function getTopReferrers(logs: VisitorLog[]) {
  const map = new Map<string, number>();

  for (const log of logs) {
    if (!log.referrer) {
      continue;
    }

    map.set(log.referrer, (map.get(log.referrer) || 0) + 1);
  }

  return [...map.entries()]
    .map(([referrer, count]) => ({
      referrer,
      count,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

export default function AdminVisitorLogsPage() {
  const [visitorLogs, setVisitorLogs] = useState<VisitorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [dateFilter, setDateFilter] = useState("");
  const [deviceFilter, setDeviceFilter] = useState<"ALL" | VisitorDeviceType>(
    "ALL",
  );
  const [pathSearch, setPathSearch] = useState("");

  async function fetchVisitorLogs() {
    try {
      setLoading(true);
      setErrorMessage("");

      const res = await fetch("/api/admin/visitor-logs", {
        cache: "no-store",
      });

      const data = (await res.json()) as VisitorLogsResponse;

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "방문 로그를 불러오지 못했습니다.");
      }

      setVisitorLogs(sortRecentLogs(data.visitorLogs || []));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "방문 로그를 불러오지 못했습니다.";

      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchVisitorLogs();
  }, []);

  const todayKey = useMemo(() => getTodayKey(), []);
  const monthKey = useMemo(() => getMonthKey(), []);

  const filteredLogs = useMemo(() => {
    const keyword = pathSearch.trim().toLowerCase();

    return visitorLogs.filter((log) => {
      if (dateFilter && log.visitedDate !== dateFilter) {
        return false;
      }

      if (deviceFilter !== "ALL" && log.deviceType !== deviceFilter) {
        return false;
      }

      if (keyword) {
        const pathMatched = log.path.toLowerCase().includes(keyword);
        const referrerMatched = (log.referrer || "")
          .toLowerCase()
          .includes(keyword);

        if (!pathMatched && !referrerMatched) {
          return false;
        }
      }

      return true;
    });
  }, [dateFilter, deviceFilter, pathSearch, visitorLogs]);

  const summary = useMemo(() => {
    const todayLogs = visitorLogs.filter((log) => log.visitedDate === todayKey);
    const monthLogs = visitorLogs.filter((log) =>
      log.visitedDate.startsWith(monthKey),
    );

    const mobileCount = visitorLogs.filter(
      (log) => log.deviceType === "MOBILE",
    ).length;

    const tabletCount = visitorLogs.filter(
      (log) => log.deviceType === "TABLET",
    ).length;

    const desktopCount = visitorLogs.filter(
      (log) => log.deviceType === "DESKTOP",
    ).length;

    const unknownCount = visitorLogs.filter(
      (log) => log.deviceType === "UNKNOWN",
    ).length;

    const reservationCount = visitorLogs.filter((log) =>
      log.path.startsWith("/reservation"),
    ).length;

    return {
      totalCount: visitorLogs.length,
      todayCount: todayLogs.length,
      monthCount: monthLogs.length,
      reservationCount,
      mobileCount,
      tabletCount,
      desktopCount,
      unknownCount,
      topPages: getTopPages(visitorLogs),
      topReferrers: getTopReferrers(visitorLogs),
    };
  }, [monthKey, todayKey, visitorLogs]);

  function resetFilters() {
    setDateFilter("");
    setDeviceFilter("ALL");
    setPathSearch("");
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">관리자</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            방문자 로그
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            IP 원문과 visitorHash는 저장 화면에 노출하지 않고, 페이지 방문
            흐름만 확인합니다.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={fetchVisitorLogs}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
          >
            새로고침
          </button>

          <Link
            href="/admin"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            대시보드
          </Link>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="전체 방문"
          value={`${summary.totalCount.toLocaleString()}건`}
          description="누적 방문 로그"
        />
        <SummaryCard
          label="오늘 방문"
          value={`${summary.todayCount.toLocaleString()}건`}
          description={todayKey}
        />
        <SummaryCard
          label="이번 달 방문"
          value={`${summary.monthCount.toLocaleString()}건`}
          description={monthKey}
        />
        <SummaryCard
          label="예약 페이지"
          value={`${summary.reservationCount.toLocaleString()}건`}
          description="/reservation 방문"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">기기별 방문</h2>
          <p className="mt-1 text-sm text-slate-500">
            User-Agent 기준으로 분류합니다.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <DeviceBox label="PC" value={summary.desktopCount} />
            <DeviceBox label="모바일" value={summary.mobileCount} />
            <DeviceBox label="태블릿" value={summary.tabletCount} />
            <DeviceBox label="기타" value={summary.unknownCount} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">인기 페이지</h2>
          <p className="mt-1 text-sm text-slate-500">
            누적 방문 기준 상위 10개 페이지입니다.
          </p>

          <div className="mt-4 space-y-2">
            {summary.topPages.length === 0 ? (
              <EmptyBox message="아직 방문 기록이 없습니다." />
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
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              방문 로그 상세
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              필터 적용 결과 {filteredLogs.length.toLocaleString()}건
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-4 xl:w-[720px]">
            <div>
              <label className="text-xs font-bold text-slate-600">방문일</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600">기기</label>
              <select
                value={deviceFilter}
                onChange={(event) =>
                  setDeviceFilter(event.target.value as "ALL" | VisitorDeviceType)
                }
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="ALL">전체</option>
                <option value="DESKTOP">PC</option>
                <option value="MOBILE">모바일</option>
                <option value="TABLET">태블릿</option>
                <option value="UNKNOWN">기타</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-600">
                페이지 / 유입 검색
              </label>
              <input
                value={pathSearch}
                onChange={(event) => setPathSearch(event.target.value)}
                placeholder="예: reservation, gallery"
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setDateFilter(todayKey)}
            className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700 hover:bg-blue-100"
          >
            오늘만 보기
          </button>

          <button
            type="button"
            onClick={() => setPathSearch("/reservation")}
            className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700 hover:bg-amber-100"
          >
            예약 페이지
          </button>

          <button
            type="button"
            onClick={resetFilters}
            className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700 hover:bg-slate-200"
          >
            필터 초기화
          </button>
        </div>

        {loading ? (
          <div className="mt-5 rounded-2xl bg-slate-50 p-6 text-sm font-semibold text-slate-500">
            방문 로그를 불러오는 중입니다.
          </div>
        ) : (
          <>
            <div className="mt-5 hidden overflow-hidden rounded-2xl border border-slate-200 lg:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">방문일시</th>
                    <th className="px-4 py-3">페이지</th>
                    <th className="px-4 py-3">기기</th>
                    <th className="px-4 py-3">유입</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-4 py-4 font-bold text-slate-900">
                        {formatDateTime(log.visitedAt)}
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-black text-slate-900">
                          {log.path}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {log.visitedDate}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        <DeviceBadge deviceType={log.deviceType} />
                      </td>

                      <td className="max-w-[420px] px-4 py-4">
                        {log.referrer ? (
                          <span className="block truncate text-slate-600">
                            {log.referrer}
                          </span>
                        ) : (
                          <span className="text-slate-400">직접 방문</span>
                        )}
                      </td>
                    </tr>
                  ))}

                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-10 text-center text-sm text-slate-500"
                      >
                        조건에 맞는 방문 로그가 없습니다.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="mt-5 space-y-3 lg:hidden">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-black text-slate-900">
                        {log.path}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {formatDateTime(log.visitedAt)}
                      </p>
                    </div>

                    <DeviceBadge deviceType={log.deviceType} />
                  </div>

                  <div className="mt-3 rounded-xl bg-slate-50 p-3">
                    <p className="text-xs font-bold text-slate-500">유입</p>
                    <p className="mt-1 break-all text-sm font-semibold text-slate-700">
                      {log.referrer || "직접 방문"}
                    </p>
                  </div>
                </div>
              ))}

              {filteredLogs.length === 0 ? (
                <EmptyBox message="조건에 맞는 방문 로그가 없습니다." />
              ) : null}
            </div>
          </>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">상위 유입 경로</h2>
        <p className="mt-1 text-sm text-slate-500">
          referrer 기준 상위 10개입니다.
        </p>

        <div className="mt-4 space-y-2">
          {summary.topReferrers.length === 0 ? (
            <EmptyBox message="아직 유입 경로 기록이 없습니다." />
          ) : (
            summary.topReferrers.map((item, index) => (
              <div
                key={item.referrer}
                className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-xs font-black text-slate-400">
                    #{index + 1}
                  </p>
                  <p className="mt-1 truncate text-sm font-bold text-slate-900">
                    {item.referrer}
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700">
                  {item.count.toLocaleString()}회
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-slate-900">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function DeviceBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black text-slate-900">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function DeviceBadge({ deviceType }: { deviceType: VisitorDeviceType }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${DEVICE_STYLE[deviceType]}`}
    >
      {DEVICE_LABEL[deviceType]}
    </span>
  );
}

function EmptyBox({ message }: { message: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm font-semibold text-slate-500">
      {message}
    </div>
  );
}