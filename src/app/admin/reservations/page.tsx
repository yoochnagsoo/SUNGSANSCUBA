"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  includesPhoneNumber,
  matchesSearchValues,
  normalizePhoneNumber,
  normalizeSearchText,
} from "@/lib/search";

type ReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED";

type ReservationSource = "CUSTOMER" | "ADMIN";

type Reservation = {
  id: string;
  source?: ReservationSource;
  name: string;
  email?: string;
  phone: string;
  program: string;
  reservationDate: string;
  people: number;
  message?: string;
  status: ReservationStatus;
  adminMemo?: string;
  experienceTime?: string;
  createdAt?: string;
  updatedAt?: string;
};

const STATUS_LABEL: Record<ReservationStatus, string> = {
  PENDING: "접수대기",
  CONFIRMED: "예약확정",
  CANCELLED: "취소",
  COMPLETED: "완료",
};

const STATUS_STYLE: Record<ReservationStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
  CONFIRMED: "bg-blue-50 text-blue-700 ring-blue-200",
  CANCELLED: "bg-rose-50 text-rose-700 ring-rose-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const SOURCE_LABEL: Record<ReservationSource, string> = {
  CUSTOMER: "고객 예약",
  ADMIN: "관리자 등록",
};

const SOURCE_STYLE: Record<ReservationSource, string> = {
  CUSTOMER: "bg-slate-50 text-slate-700 ring-slate-200",
  ADMIN: "bg-violet-50 text-violet-700 ring-violet-200",
};

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function formatDateTime(value?: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("ko-KR");
}

function getCreatedAtTime(value?: string) {
  if (!value) {
    return 0;
  }

  const time = new Date(value).getTime();

  if (Number.isNaN(time)) {
    return 0;
  }

  return time;
}

function normalizeSource(source?: ReservationSource): ReservationSource {
  if (source === "ADMIN") {
    return "ADMIN";
  }

  return "CUSTOMER";
}

function getSourceSearchText(source?: ReservationSource) {
  const normalizedSource = normalizeSource(source);

  if (normalizedSource === "ADMIN") {
    return "admin 관리자 등록 관리자등록";
  }

  return "customer 고객 예약 고객예약";
}

function getStatusSearchText(status: ReservationStatus) {
  return `${status.toLowerCase()} ${STATUS_LABEL[status]}`;
}

function SourceBadge({ source }: { source?: ReservationSource }) {
  const normalizedSource = normalizeSource(source);

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${
        SOURCE_STYLE[normalizedSource]
      }`}
    >
      {SOURCE_LABEL[normalizedSource]}
    </span>
  );
}

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | ReservationStatus
  >("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    async function fetchReservations() {
      try {
        setLoading(true);
        setErrorMessage("");

        const res = await fetch("/api/reservations", {
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok || !data.ok) {
          throw new Error(
            data.message || "예약 목록을 불러오지 못했습니다.",
          );
        }

        setReservations(
          Array.isArray(data.reservations) ? data.reservations : [],
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "예약 목록을 불러오지 못했습니다.";

        setErrorMessage(message);
      } finally {
        setLoading(false);
      }
    }

    fetchReservations();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [keyword, statusFilter, pageSize]);

  const filteredReservations = useMemo(() => {
    const normalizedKeyword = normalizeSearchText(keyword);
    const normalizedPhoneKeyword = normalizePhoneNumber(keyword);

    return reservations
      .filter((reservation) => {
        if (
          statusFilter !== "ALL" &&
          reservation.status !== statusFilter
        ) {
          return false;
        }

        if (!normalizedKeyword) {
          return true;
        }

        const matchesText = matchesSearchValues(
          [
            reservation.name,
            reservation.email,
            reservation.phone,
            reservation.program,
            reservation.reservationDate,
            reservation.experienceTime,
            reservation.message,
            reservation.adminMemo,
            getSourceSearchText(reservation.source),
            getStatusSearchText(reservation.status),
          ],
          normalizedKeyword,
        );

        const matchesPhone = includesPhoneNumber(
          reservation.phone,
          normalizedPhoneKeyword,
        );

        return matchesText || matchesPhone;
      })
      .sort(
        (a, b) =>
          getCreatedAtTime(b.createdAt) -
          getCreatedAtTime(a.createdAt),
      );
  }, [reservations, keyword, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredReservations.length / pageSize),
  );

  const safePage = Math.min(page, totalPages);

  const pagedReservations = useMemo(() => {
    const startIndex = (safePage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return filteredReservations.slice(startIndex, endIndex);
  }, [filteredReservations, safePage, pageSize]);

  const startNumber =
    filteredReservations.length === 0
      ? 0
      : (safePage - 1) * pageSize + 1;

  const endNumber = Math.min(
    safePage * pageSize,
    filteredReservations.length,
  );

  const totalCount = reservations.length;

  const pendingCount = reservations.filter(
    (item) => item.status === "PENDING",
  ).length;

  const confirmedCount = reservations.filter(
    (item) => item.status === "CONFIRMED",
  ).length;

  function goPrevPage() {
    setPage((prev) => Math.max(1, prev - 1));
  }

  function goNextPage() {
    setPage((prev) => Math.min(totalPages, prev + 1));
  }

  function resetSearch() {
    setKeyword("");
    setStatusFilter("ALL");
    setPage(1);
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            관리자
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            예약관리
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            접수일시 기준 최신 예약부터 표시됩니다.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:min-w-[360px]">
          <SummaryCard label="전체" value={totalCount} />
          <SummaryCard label="접수대기" value={pendingCount} />
          <SummaryCard label="예약확정" value={confirmedCount} />
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_160px_auto]">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="이름, 연락처, 이메일, 프로그램, 예약일, 시간, 상태로 검색"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as
                  | "ALL"
                  | ReservationStatus,
              )
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="ALL">전체 상태</option>
            <option value="PENDING">접수대기</option>
            <option value="CONFIRMED">예약확정</option>
            <option value="CANCELLED">취소</option>
            <option value="COMPLETED">완료</option>
          </select>

          <select
            value={pageSize}
            onChange={(event) =>
              setPageSize(Number(event.target.value))
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}개씩 보기
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={resetSearch}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            초기화
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-2 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            총{" "}
            <span className="font-bold text-slate-900">
              {filteredReservations.length}
            </span>
            건 중{" "}
            <span className="font-bold text-slate-900">
              {startNumber}
            </span>
            {" - "}
            <span className="font-bold text-slate-900">
              {endNumber}
            </span>
            건 표시
          </p>

          <p>
            {safePage} / {totalPages} 페이지
          </p>
        </div>

        {errorMessage ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-5 rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
            예약 목록을 불러오는 중입니다.
          </div>
        ) : (
          <>
            <div className="mt-5 hidden overflow-hidden rounded-2xl border border-slate-200 lg:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">구분</th>
                    <th className="px-4 py-3">접수일시</th>
                    <th className="px-4 py-3">예약일</th>
                    <th className="px-4 py-3">체험시간</th>
                    <th className="px-4 py-3">고객</th>
                    <th className="px-4 py-3">프로그램</th>
                    <th className="px-4 py-3">인원</th>
                    <th className="px-4 py-3">상태</th>
                    <th className="px-4 py-3 text-right">관리</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {pagedReservations.map((reservation) => (
                    <tr
                      key={reservation.id}
                      className="hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-4 py-4">
                        <SourceBadge source={reservation.source} />
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                        {formatDateTime(reservation.createdAt)}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-900">
                        {reservation.reservationDate}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 font-bold text-blue-700">
                        {reservation.experienceTime || "미정"}
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-900">
                          {reservation.name}
                        </div>

                        <div className="mt-1 text-xs text-slate-500">
                          {reservation.phone}
                        </div>

                        {reservation.email ? (
                          <div className="mt-1 text-xs text-slate-400">
                            {reservation.email}
                          </div>
                        ) : null}
                      </td>

                      <td className="px-4 py-4 text-slate-700">
                        {reservation.program}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-700">
                        {reservation.people}명
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${
                            STATUS_STYLE[reservation.status]
                          }`}
                        >
                          {STATUS_LABEL[reservation.status]}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 text-right">
                        <Link
                          href={`/admin/reservations/${reservation.id}`}
                          className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700"
                        >
                          상세보기
                        </Link>
                      </td>
                    </tr>
                  ))}

                  {pagedReservations.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-10 text-center text-sm text-slate-500"
                      >
                        검색 조건에 맞는 예약이 없습니다.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="mt-5 space-y-3 lg:hidden">
              {pagedReservations.map((reservation) => (
                <Link
                  key={reservation.id}
                  href={`/admin/reservations/${reservation.id}`}
                  className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <SourceBadge source={reservation.source} />

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${
                            STATUS_STYLE[reservation.status]
                          }`}
                        >
                          {STATUS_LABEL[reservation.status]}
                        </span>
                      </div>

                      <p className="mt-3 text-xs text-slate-500">
                        접수일시{" "}
                        {formatDateTime(reservation.createdAt)}
                      </p>

                      <p className="mt-1 text-lg font-bold text-slate-900">
                        {reservation.name}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {reservation.phone}
                      </p>

                      {reservation.email ? (
                        <p className="mt-1 break-all text-xs text-slate-400">
                          {reservation.email}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <MobileInfo
                      label="예약일"
                      value={reservation.reservationDate}
                    />

                    <MobileInfo
                      label="체험시간"
                      value={reservation.experienceTime || "미정"}
                    />

                    <MobileInfo
                      label="프로그램"
                      value={reservation.program}
                    />

                    <MobileInfo
                      label="인원"
                      value={`${reservation.people}명`}
                    />
                  </div>
                </Link>
              ))}

              {pagedReservations.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                  검색 조건에 맞는 예약이 없습니다.
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">
                {safePage} / {totalPages} 페이지
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage(1)}
                  disabled={safePage <= 1}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  처음
                </button>

                <button
                  type="button"
                  onClick={goPrevPage}
                  disabled={safePage <= 1}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  이전
                </button>

                <div className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white">
                  {safePage}
                </div>

                <button
                  type="button"
                  onClick={goNextPage}
                  disabled={safePage >= totalPages}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  다음
                </button>

                <button
                  type="button"
                  onClick={() => setPage(totalPages)}
                  disabled={safePage >= totalPages}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  마지막
                </button>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
      <p className="text-xs font-semibold text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-xl font-black text-slate-900">
        {value}
      </p>
    </div>
  );
}

function MobileInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs font-semibold text-slate-500">
        {label}
      </p>

      <p className="mt-1 break-words font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}