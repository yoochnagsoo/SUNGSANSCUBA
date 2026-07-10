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

type PaymentMethod =
  | "CASH"
  | "CARD"
  | "TRANSFER"
  | "NAVER_PAY"
  | "KAKAO_PAY"
  | "ETC";

type Reservation = {
  id: string;
  source?: ReservationSource;
  name: string;
  phone: string;
  email?: string;
  program: string;
  reservationDate: string;
  people: number;
  message?: string;
  status: ReservationStatus;
  adminMemo?: string;
  experienceTime?: string;
  paymentAmount?: number;
  paymentMethod?: PaymentMethod;
  paymentMemo?: string;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

type CustomerGroup = {
  key: string;
  name: string;
  phone: string;
  email: string;
  normalizedPhone: string;
  reservations: Reservation[];
  totalReservations: number;
  completedReservations: number;
  cancelledReservations: number;
  pendingReservations: number;
  confirmedReservations: number;
  totalPeople: number;
  totalPaymentAmount: number;
  hasCustomerReservation: boolean;
  hasAdminReservation: boolean;
  latestReservation?: Reservation;
  latestReservationDate: string;
  latestCreatedAt?: string;
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

const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: "현금",
  CARD: "카드",
  TRANSFER: "계좌이체",
  NAVER_PAY: "네이버페이",
  KAKAO_PAY: "카카오페이",
  ETC: "기타",
};

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

function normalizeSource(source?: ReservationSource): ReservationSource {
  if (source === "ADMIN") {
    return "ADMIN";
  }

  return "CUSTOMER";
}

function getDateTimeValue(value?: string) {
  if (!value) {
    return 0;
  }

  const time = new Date(value).getTime();

  if (Number.isNaN(time)) {
    return 0;
  }

  return time;
}

function getReservationDateValue(value?: string) {
  if (!value) {
    return 0;
  }

  const time = new Date(`${value}T00:00:00`).getTime();

  if (Number.isNaN(time)) {
    return 0;
  }

  return time;
}

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

function formatCurrency(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function getPaymentAmount(reservation: Reservation) {
  if (typeof reservation.paymentAmount !== "number") {
    return 0;
  }

  if (!Number.isFinite(reservation.paymentAmount)) {
    return 0;
  }

  return reservation.paymentAmount;
}

function getPaymentMethodText(reservation: Reservation) {
  if (!reservation.paymentMethod) {
    return "";
  }

  return (
    PAYMENT_METHOD_LABEL[reservation.paymentMethod] ||
    reservation.paymentMethod
  );
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

function sortReservationsLatestFirst(
  a: Reservation,
  b: Reservation,
) {
  const dateDiff =
    getReservationDateValue(b.reservationDate) -
    getReservationDateValue(a.reservationDate);

  if (dateDiff !== 0) {
    return dateDiff;
  }

  return (
    getDateTimeValue(b.createdAt) -
    getDateTimeValue(a.createdAt)
  );
}

function SourceBadge({ source }: { source?: ReservationSource }) {
  const normalizedSource = normalizeSource(source);

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${
        SOURCE_STYLE[normalizedSource]
      }`}
    >
      {SOURCE_LABEL[normalizedSource]}
    </span>
  );
}

function CustomerSourceSummary({
  customer,
}: {
  customer: CustomerGroup;
}) {
  if (
    customer.hasCustomerReservation &&
    customer.hasAdminReservation
  ) {
    return (
      <div className="flex flex-wrap gap-1.5">
        <SourceBadge source="CUSTOMER" />
        <SourceBadge source="ADMIN" />
      </div>
    );
  }

  if (customer.hasAdminReservation) {
    return <SourceBadge source="ADMIN" />;
  }

  return <SourceBadge source="CUSTOMER" />;
}

export default function AdminCustomersPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [keyword, setKeyword] = useState("");
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
            data.message || "고객 목록을 불러오지 못했습니다.",
          );
        }

        setReservations(
          Array.isArray(data.reservations) ? data.reservations : [],
        );
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "고객 목록을 불러오지 못했습니다.";

        setErrorMessage(message);
      } finally {
        setLoading(false);
      }
    }

    fetchReservations();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [keyword, pageSize]);

  const customerGroups = useMemo(() => {
    const map = new Map<string, CustomerGroup>();

    for (const reservation of reservations) {
      const name = normalizeName(reservation.name);
      const normalizedPhone = normalizePhoneNumber(
        reservation.phone,
      );

      const key = `${name}__${normalizedPhone}`;

      if (!map.has(key)) {
        map.set(key, {
          key,
          name,
          phone: reservation.phone,
          email: reservation.email || "",
          normalizedPhone,
          reservations: [],
          totalReservations: 0,
          completedReservations: 0,
          cancelledReservations: 0,
          pendingReservations: 0,
          confirmedReservations: 0,
          totalPeople: 0,
          totalPaymentAmount: 0,
          hasCustomerReservation: false,
          hasAdminReservation: false,
          latestReservationDate: "-",
        });
      }

      const group = map.get(key);

      if (!group) {
        continue;
      }

      const source = normalizeSource(reservation.source);

      group.reservations.push({
        ...reservation,
        source,
      });

      group.totalReservations += 1;
      group.totalPeople += Number(reservation.people || 0);
      group.totalPaymentAmount += getPaymentAmount(reservation);

      if (!group.email && reservation.email) {
        group.email = reservation.email;
      }

      if (reservation.status === "COMPLETED") {
        group.completedReservations += 1;
      }

      if (reservation.status === "CANCELLED") {
        group.cancelledReservations += 1;
      }

      if (reservation.status === "PENDING") {
        group.pendingReservations += 1;
      }

      if (reservation.status === "CONFIRMED") {
        group.confirmedReservations += 1;
      }

      if (source === "ADMIN") {
        group.hasAdminReservation = true;
      } else {
        group.hasCustomerReservation = true;
      }
    }

    return Array.from(map.values())
      .map((group) => {
        const sortedReservations = [
          ...group.reservations,
        ].sort(sortReservationsLatestFirst);

        const latestReservation = sortedReservations[0];

        return {
          ...group,
          reservations: sortedReservations,
          latestReservation,
          latestReservationDate:
            latestReservation?.reservationDate || "-",
          latestCreatedAt: latestReservation?.createdAt,
        };
      })
      .sort((a, b) => {
        const latestReservationDateDiff =
          getReservationDateValue(b.latestReservationDate) -
          getReservationDateValue(a.latestReservationDate);

        if (latestReservationDateDiff !== 0) {
          return latestReservationDateDiff;
        }

        return (
          getDateTimeValue(b.latestCreatedAt) -
          getDateTimeValue(a.latestCreatedAt)
        );
      });
  }, [reservations]);

  const filteredCustomers = useMemo(() => {
    const normalizedKeyword = normalizeSearchText(keyword);
    const normalizedPhoneKeyword =
      normalizePhoneNumber(keyword);

    if (!normalizedKeyword) {
      return customerGroups;
    }

    return customerGroups.filter((customer) => {
      const sourceSummaryText = [
        customer.hasCustomerReservation
          ? "customer 고객 예약 고객예약"
          : "",
        customer.hasAdminReservation
          ? "admin 관리자 등록 관리자등록"
          : "",
      ]
        .filter(Boolean)
        .join(" ");

      const customerMatched = matchesSearchValues(
        [
          customer.name,
          customer.phone,
          customer.email,
          sourceSummaryText,
        ],
        normalizedKeyword,
      );

      const phoneMatched = includesPhoneNumber(
        customer.phone,
        normalizedPhoneKeyword,
      );

      const reservationMatched = customer.reservations.some(
        (reservation) =>
          matchesSearchValues(
            [
              reservation.program,
              reservation.reservationDate,
              reservation.experienceTime,
              reservation.message,
              reservation.adminMemo,
              reservation.paymentMemo,
              getStatusSearchText(reservation.status),
              getSourceSearchText(reservation.source),
              getPaymentMethodText(reservation),
            ],
            normalizedKeyword,
          ),
      );

      return (
        customerMatched ||
        phoneMatched ||
        reservationMatched
      );
    });
  }, [customerGroups, keyword]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCustomers.length / pageSize),
  );

  const safePage = Math.min(page, totalPages);

  const pagedCustomers = useMemo(() => {
    const startIndex = (safePage - 1) * pageSize;
    const endIndex = startIndex + pageSize;

    return filteredCustomers.slice(startIndex, endIndex);
  }, [filteredCustomers, safePage, pageSize]);

  const startNumber =
    filteredCustomers.length === 0
      ? 0
      : (safePage - 1) * pageSize + 1;

  const endNumber = Math.min(
    safePage * pageSize,
    filteredCustomers.length,
  );

  const totalCustomerCount = customerGroups.length;

  const repeatCustomerCount = customerGroups.filter(
    (customer) => customer.totalReservations >= 2,
  ).length;

  const totalReservationCount = reservations.length;

  const totalCompletedReservationCount = reservations.filter(
    (reservation) => reservation.status === "COMPLETED",
  ).length;

  const totalPaymentAmount = reservations.reduce(
    (total, reservation) =>
      total + getPaymentAmount(reservation),
    0,
  );

  function goPrevPage() {
    setPage((prev) => Math.max(1, prev - 1));
  }

  function goNextPage() {
    setPage((prev) => Math.min(totalPages, prev + 1));
  }

  function resetSearch() {
    setKeyword("");
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
            고객관리
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            이름과 전화번호가 모두 같은 예약만 같은 고객으로
            묶습니다.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 lg:min-w-[720px]">
          <SummaryCard
            label="고객"
            value={totalCustomerCount}
          />

          <SummaryCard
            label="재예약 고객"
            value={repeatCustomerCount}
          />

          <SummaryCard
            label="전체 예약"
            value={totalReservationCount}
          />

          <SummaryCard
            label="완료 예약"
            value={totalCompletedReservationCount}
          />

          <SummaryCard
            label="총 결제금액"
            value={formatCurrency(totalPaymentAmount)}
          />
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_160px_auto]">
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="이름, 연락처, 이메일, 프로그램, 예약일, 시간, 상태, 결제방법으로 검색"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />

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
              {filteredCustomers.length}
            </span>
            명 중{" "}
            <span className="font-bold text-slate-900">
              {startNumber}
            </span>
            {" - "}
            <span className="font-bold text-slate-900">
              {endNumber}
            </span>
            명 표시
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
            고객 목록을 불러오는 중입니다.
          </div>
        ) : (
          <>
            <div className="mt-5 hidden overflow-hidden rounded-2xl border border-slate-200 lg:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">고객</th>
                    <th className="px-4 py-3">구분</th>
                    <th className="px-4 py-3">예약/상태</th>
                    <th className="px-4 py-3">인원/결제</th>
                    <th className="px-4 py-3">최근 예약</th>
                    <th className="px-4 py-3">예약일 목록</th>
                    <th className="px-4 py-3">최근 접수일시</th>
                    <th className="px-4 py-3 text-right">
                      관리
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {pagedCustomers.map((customer) => {
                    const latestReservation =
                      customer.latestReservation;

                    return (
                      <tr
                        key={customer.key}
                        className="align-top hover:bg-slate-50"
                      >
                        <td className="px-4 py-4">
                          <div className="font-bold text-slate-900">
                            {customer.name}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            {customer.phone}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            {customer.email || "이메일 없음"}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <CustomerSourceSummary
                            customer={customer}
                          />
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-black text-white">
                              총 {customer.totalReservations}건
                            </span>

                            <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                              완료{" "}
                              {customer.completedReservations}건
                            </span>

                            <span className="inline-flex rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 ring-1 ring-rose-200">
                              취소{" "}
                              {customer.cancelledReservations}건
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-200">
                              대기{" "}
                              {customer.pendingReservations}건
                            </span>

                            <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-blue-200">
                              확정{" "}
                              {customer.confirmedReservations}건
                            </span>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <div className="font-semibold text-slate-700">
                            총 인원 {customer.totalPeople}명
                          </div>

                          <div className="mt-1 font-black text-emerald-700">
                            {formatCurrency(
                              customer.totalPaymentAmount,
                            )}
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4">
                          <div className="font-semibold text-slate-900">
                            {customer.latestReservationDate}
                          </div>

                          <div className="mt-1 text-xs font-bold text-blue-700">
                            {latestReservation?.experienceTime ||
                              "미정"}
                          </div>

                          {latestReservation ? (
                            <>
                              <div className="mt-2 text-xs font-semibold text-slate-600">
                                {latestReservation.program}
                              </div>

                              <div className="mt-2">
                                <span
                                  className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${
                                    STATUS_STYLE[
                                      latestReservation.status
                                    ]
                                  }`}
                                >
                                  {
                                    STATUS_LABEL[
                                      latestReservation.status
                                    ]
                                  }
                                </span>
                              </div>
                            </>
                          ) : null}
                        </td>

                        <td className="px-4 py-4">
                          <div className="max-w-[460px] space-y-2">
                            {customer.reservations.map(
                              (reservation) => (
                                <div
                                  key={reservation.id}
                                  className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <SourceBadge
                                          source={
                                            reservation.source
                                          }
                                        />

                                        <span className="font-black text-slate-900">
                                          {reservation.reservationDate ||
                                            "-"}
                                        </span>

                                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
                                          {reservation.experienceTime ||
                                            "미정"}
                                        </span>

                                        <span
                                          className={`rounded-full px-2 py-0.5 text-xs font-bold ring-1 ${
                                            STATUS_STYLE[
                                              reservation.status
                                            ]
                                          }`}
                                        >
                                          {
                                            STATUS_LABEL[
                                              reservation.status
                                            ]
                                          }
                                        </span>
                                      </div>

                                      <p className="mt-1 truncate text-xs font-semibold text-slate-600">
                                        {reservation.program} ·{" "}
                                        {reservation.people}명
                                      </p>

                                      {getPaymentAmount(
                                        reservation,
                                      ) > 0 ? (
                                        <p className="mt-1 text-xs font-bold text-emerald-700">
                                          결제{" "}
                                          {formatCurrency(
                                            getPaymentAmount(
                                              reservation,
                                            ),
                                          )}
                                          {reservation.paymentMethod
                                            ? ` · ${getPaymentMethodText(
                                                reservation,
                                              )}`
                                            : ""}
                                        </p>
                                      ) : null}
                                    </div>

                                    <Link
                                      href={`/admin/reservations/${reservation.id}`}
                                      className="shrink-0 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700"
                                    >
                                      보기
                                    </Link>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-slate-600">
                          {formatDateTime(
                            customer.latestCreatedAt,
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 text-right">
                          {latestReservation ? (
                            <Link
                              href={`/admin/reservations/${latestReservation.id}`}
                              className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700"
                            >
                              최근예약 보기
                            </Link>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {pagedCustomers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-10 text-center text-sm text-slate-500"
                      >
                        검색 조건에 맞는 고객이 없습니다.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="mt-5 space-y-3 lg:hidden">
              {pagedCustomers.map((customer) => {
                const latestReservation =
                  customer.latestReservation;

                return (
                  <div
                    key={customer.key}
                    className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-bold text-slate-900">
                          {customer.name}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                          {customer.phone}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {customer.email || "이메일 없음"}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full bg-slate-900 px-3 py-1 text-xs font-black text-white">
                        {customer.totalReservations}건
                      </span>
                    </div>

                    <div className="mt-3">
                      <CustomerSourceSummary
                        customer={customer}
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                      <MobileInfo
                        label="총 예약수"
                        value={`${customer.totalReservations}건`}
                      />

                      <MobileInfo
                        label="완료 / 취소"
                        value={`${customer.completedReservations}건 / ${customer.cancelledReservations}건`}
                      />

                      <MobileInfo
                        label="총 인원"
                        value={`${customer.totalPeople}명`}
                      />

                      <MobileInfo
                        label="총 결제금액"
                        value={formatCurrency(
                          customer.totalPaymentAmount,
                        )}
                      />

                      <MobileInfo
                        label="최근 예약일"
                        value={customer.latestReservationDate}
                      />

                      <MobileInfo
                        label="최근 체험시간"
                        value={
                          latestReservation?.experienceTime ||
                          "미정"
                        }
                      />
                    </div>

                    <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm">
                      <p className="text-xs font-semibold text-slate-500">
                        최근 접수일시
                      </p>

                      <p className="mt-1 font-bold text-slate-900">
                        {formatDateTime(
                          customer.latestCreatedAt,
                        )}
                      </p>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm font-black text-slate-900">
                        예약일 목록
                      </p>

                      <div className="mt-2 space-y-2">
                        {customer.reservations.map(
                          (reservation) => (
                            <div
                              key={reservation.id}
                              className="rounded-xl border border-slate-200 bg-white p-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <SourceBadge
                                      source={
                                        reservation.source
                                      }
                                    />

                                    <span className="font-black text-slate-900">
                                      {reservation.reservationDate ||
                                        "-"}
                                    </span>

                                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700">
                                      {reservation.experienceTime ||
                                        "미정"}
                                    </span>

                                    <span
                                      className={`rounded-full px-2 py-0.5 text-xs font-bold ring-1 ${
                                        STATUS_STYLE[
                                          reservation.status
                                        ]
                                      }`}
                                    >
                                      {
                                        STATUS_LABEL[
                                          reservation.status
                                        ]
                                      }
                                    </span>
                                  </div>

                                  <p className="mt-1 truncate text-xs font-semibold text-slate-600">
                                    {reservation.program} ·{" "}
                                    {reservation.people}명
                                  </p>

                                  {getPaymentAmount(
                                    reservation,
                                  ) > 0 ? (
                                    <p className="mt-1 text-xs font-bold text-emerald-700">
                                      결제{" "}
                                      {formatCurrency(
                                        getPaymentAmount(
                                          reservation,
                                        ),
                                      )}
                                      {reservation.paymentMethod
                                        ? ` · ${getPaymentMethodText(
                                            reservation,
                                          )}`
                                        : ""}
                                    </p>
                                  ) : null}
                                </div>

                                <Link
                                  href={`/admin/reservations/${reservation.id}`}
                                  className="shrink-0 rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-700"
                                >
                                  보기
                                </Link>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>

                    {latestReservation ? (
                      <Link
                        href={`/admin/reservations/${latestReservation.id}`}
                        className="mt-4 block rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-bold text-white hover:bg-slate-700"
                      >
                        최근예약 보기
                      </Link>
                    ) : null}
                  </div>
                );
              })}

              {pagedCustomers.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                  검색 조건에 맞는 고객이 없습니다.
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
  value: number | string;
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