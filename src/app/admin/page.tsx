"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import VisitorSummaryCards from "@/components/admin/VisitorSummaryCards";

type ReservationStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
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

function normalizeSource(source?: ReservationSource): ReservationSource {
  if (source === "ADMIN") {
    return "ADMIN";
  }

  return "CUSTOMER";
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toMonthKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");

  return `${year}-${month}`;
}

function getReservationDateValue(value?: string) {
  if (!value) return 0;

  const time = new Date(`${value}T00:00:00`).getTime();

  if (Number.isNaN(time)) return 0;

  return time;
}

function getCreatedAtTime(value?: string) {
  if (!value) return 0;

  const time = new Date(value).getTime();

  if (Number.isNaN(time)) return 0;

  return time;
}

function getTimeValue(time?: string) {
  if (!time) return 999999;

  const [hourText, minuteText] = time.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return 999999;
  }

  return hour * 60 + minute;
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

function formatCurrency(value: number) {
  return `${Math.round(value).toLocaleString("ko-KR")}원`;
}

function formatDateTime(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("ko-KR");
}

function sortByDateAndExperienceTime(a: Reservation, b: Reservation) {
  const dateDiff =
    getReservationDateValue(a.reservationDate) -
    getReservationDateValue(b.reservationDate);

  if (dateDiff !== 0) {
    return dateDiff;
  }

  const timeDiff =
    getTimeValue(a.experienceTime) - getTimeValue(b.experienceTime);

  if (timeDiff !== 0) {
    return timeDiff;
  }

  return getCreatedAtTime(a.createdAt) - getCreatedAtTime(b.createdAt);
}

function sortTodayByExperienceTime(a: Reservation, b: Reservation) {
  const timeDiff =
    getTimeValue(a.experienceTime) - getTimeValue(b.experienceTime);

  if (timeDiff !== 0) {
    return timeDiff;
  }

  return getCreatedAtTime(a.createdAt) - getCreatedAtTime(b.createdAt);
}

function sortLatestCreatedFirst(a: Reservation, b: Reservation) {
  return getCreatedAtTime(b.createdAt) - getCreatedAtTime(a.createdAt);
}

export default function AdminDashboardPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

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
          throw new Error(data.message || "예약 정보를 불러오지 못했습니다.");
        }

        const normalizedReservations = (data.reservations || []).map(
          (reservation: Reservation) => ({
            ...reservation,
            source: normalizeSource(reservation.source),
          }),
        );

        setReservations(normalizedReservations);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "예약 정보를 불러오지 못했습니다.";

        setErrorMessage(message);
      } finally {
        setLoading(false);
      }
    }

    fetchReservations();
  }, []);

  const todayKey = useMemo(() => toDateKey(new Date()), []);
  const currentMonthKey = useMemo(() => toMonthKey(new Date()), []);

  const dashboardData = useMemo(() => {
    const todayReservations = reservations
      .filter((reservation) => reservation.reservationDate === todayKey)
      .sort(sortTodayByExperienceTime);

    const upcomingReservations = reservations
      .filter((reservation) => {
        if (reservation.status === "CANCELLED") {
          return false;
        }

        return reservation.reservationDate > todayKey;
      })
      .sort(sortByDateAndExperienceTime)
      .slice(0, 10);

    const pendingReservations = reservations
      .filter((reservation) => reservation.status === "PENDING")
      .sort(sortByDateAndExperienceTime)
      .slice(0, 10);

    const recentReservations = [...reservations]
      .sort(sortLatestCreatedFirst)
      .slice(0, 5);

    const totalCount = reservations.length;

    const todayPeople = todayReservations.reduce(
      (sum, reservation) => sum + Number(reservation.people || 0),
      0,
    );

    const pendingCount = reservations.filter(
      (reservation) => reservation.status === "PENDING",
    ).length;

    const confirmedCount = reservations.filter(
      (reservation) => reservation.status === "CONFIRMED",
    ).length;

    const completedCount = reservations.filter(
      (reservation) => reservation.status === "COMPLETED",
    ).length;

    const cancelledCount = reservations.filter(
      (reservation) => reservation.status === "CANCELLED",
    ).length;

    const upcomingCount = reservations.filter((reservation) => {
      if (reservation.status === "CANCELLED") {
        return false;
      }

      return reservation.reservationDate >= todayKey;
    }).length;

    const customerReservationCount = reservations.filter(
      (reservation) => normalizeSource(reservation.source) === "CUSTOMER",
    ).length;

    const adminReservationCount = reservations.filter(
      (reservation) => normalizeSource(reservation.source) === "ADMIN",
    ).length;

    const currentMonthCompletedReservations = reservations.filter(
      (reservation) => {
        if (reservation.status !== "COMPLETED") {
          return false;
        }

        return reservation.reservationDate.startsWith(currentMonthKey);
      },
    );

    const currentMonthCompletedPeople = currentMonthCompletedReservations.reduce(
      (sum, reservation) => sum + Number(reservation.people || 0),
      0,
    );

    const currentMonthRevenue = currentMonthCompletedReservations.reduce(
      (sum, reservation) => sum + getPaymentAmount(reservation),
      0,
    );

    return {
      todayReservations,
      upcomingReservations,
      pendingReservations,
      recentReservations,
      totalCount,
      todayPeople,
      pendingCount,
      confirmedCount,
      completedCount,
      cancelledCount,
      upcomingCount,
      customerReservationCount,
      adminReservationCount,
      currentMonthCompletedReservations,
      currentMonthCompletedPeople,
      currentMonthRevenue,
    };
  }, [reservations, todayKey, currentMonthKey]);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">관리자</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-2 text-sm text-slate-500">
            오늘 예약, 접수대기, 이번 달 완료 매출을 한눈에 확인합니다.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/reservations"
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
          >
            예약관리
          </Link>

          <Link
            href="/admin/calendar"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            캘린더
          </Link>

          <Link
            href="/admin/customers"
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            고객관리
          </Link>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="오늘 예약"
          value={`${dashboardData.todayReservations.length}건`}
          description={`오늘 인원 ${dashboardData.todayPeople}명`}
        />
        <SummaryCard
          label="접수대기"
          value={`${dashboardData.pendingCount}건`}
          description="확인이 필요한 예약"
        />
        <SummaryCard
          label="예약확정"
          value={`${dashboardData.confirmedCount}건`}
          description="진행 예정 예약"
        />
        <SummaryCard
          label="예정 예약"
          value={`${dashboardData.upcomingCount}건`}
          description="취소 제외, 오늘 이후"
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="전체 예약"
          value={`${dashboardData.totalCount}건`}
          description="누적 예약"
        />
        <SummaryCard
          label="완료 예약"
          value={`${dashboardData.completedCount}건`}
          description={`이번 달 완료 ${dashboardData.currentMonthCompletedReservations.length}건`}
        />
        <SummaryCard
          label="취소 예약"
          value={`${dashboardData.cancelledCount}건`}
          description="누적 취소"
        />
        <SummaryCard
          label="이번 달 완료 매출"
          value={formatCurrency(dashboardData.currentMonthRevenue)}
          description={`이번 달 완료 인원 ${dashboardData.currentMonthCompletedPeople}명`}
        />
      </section>

     
      <VisitorSummaryCards />

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Dashboard 정보를 불러오는 중입니다.
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">오늘 예약</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {todayKey} 기준, 체험시간 순서
                </p>
              </div>

              <Link
                href="/admin/calendar"
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                캘린더 보기
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {dashboardData.todayReservations.map((reservation) => (
                <ReservationCard
                  key={reservation.id}
                  reservation={reservation}
                  showDate={false}
                />
              ))}

              {dashboardData.todayReservations.length === 0 ? (
                <EmptyBox message="오늘 예약이 없습니다." />
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">접수대기</h2>
                <p className="mt-1 text-sm text-slate-500">
                  확인이 필요한 예약입니다.
                </p>
              </div>

              <Link
                href="/admin/reservations"
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                전체 보기
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {dashboardData.pendingReservations.map((reservation) => (
                <ReservationCard
                  key={reservation.id}
                  reservation={reservation}
                  showDate
                />
              ))}

              {dashboardData.pendingReservations.length === 0 ? (
                <EmptyBox message="접수대기 예약이 없습니다." />
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 xl:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  최근 접수 예약
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  접수일시 기준 최신 예약 5건입니다.
                </p>
              </div>

              <Link
                href="/admin/reservations"
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                예약관리
              </Link>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-5">
              {dashboardData.recentReservations.map((reservation) => (
                <Link
                  key={reservation.id}
                  href={`/admin/reservations/${reservation.id}`}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:bg-slate-50"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <SourceBadge source={reservation.source} />
                    <StatusBadge status={reservation.status} />
                  </div>

                  <p className="mt-3 text-base font-black text-slate-900">
                    {reservation.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {reservation.phone}
                  </p>

                  <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs">
                    <p className="font-bold text-slate-900">
                      {reservation.reservationDate || "-"} ·{" "}
                      {reservation.experienceTime || "미정"}
                    </p>
                    <p className="mt-1 truncate font-semibold text-slate-600">
                      {reservation.program} · {reservation.people}명
                    </p>
                  </div>

                  <p className="mt-3 text-xs text-slate-500">
                    접수 {formatDateTime(reservation.createdAt)}
                  </p>
                </Link>
              ))}

              {dashboardData.recentReservations.length === 0 ? (
                <div className="lg:col-span-5">
                  <EmptyBox message="최근 접수 예약이 없습니다." />
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 xl:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">예정 예약</h2>
                <p className="mt-1 text-sm text-slate-500">
                  취소 예약을 제외하고 가까운 날짜부터 표시합니다.
                </p>
              </div>

              <Link
                href="/admin/reservations"
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                예약관리
              </Link>
            </div>

            <div className="mt-5 hidden overflow-hidden rounded-2xl border border-slate-200 lg:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">구분</th>
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
                  {dashboardData.upcomingReservations.map((reservation) => (
                    <tr key={reservation.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-4 py-4">
                        <SourceBadge source={reservation.source} />
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 font-bold text-slate-900">
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
                      </td>

                      <td className="px-4 py-4 text-slate-700">
                        {reservation.program}
                      </td>

                      <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-700">
                        {reservation.people}명
                      </td>

                      <td className="whitespace-nowrap px-4 py-4">
                        <StatusBadge status={reservation.status} />
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

                  {dashboardData.upcomingReservations.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-10 text-center text-sm text-slate-500"
                      >
                        예정 예약이 없습니다.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="mt-5 space-y-3 lg:hidden">
              {dashboardData.upcomingReservations.map((reservation) => (
                <ReservationCard
                  key={reservation.id}
                  reservation={reservation}
                  showDate
                />
              ))}

              {dashboardData.upcomingReservations.length === 0 ? (
                <EmptyBox message="예정 예약이 없습니다." />
              ) : null}
            </div>
          </section>
        </div>
      )}
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

function StatusBadge({ status }: { status: ReservationStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ring-1 ${STATUS_STYLE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function SourceBadge({ source }: { source?: ReservationSource }) {
  const normalizedSource = normalizeSource(source);

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${
        SOURCE_STYLE[normalizedSource]
      }`}
    >
      {SOURCE_LABEL[normalizedSource]}
    </span>
  );
}

function ReservationCard({
  reservation,
  showDate,
}: {
  reservation: Reservation;
  showDate: boolean;
}) {
  return (
    <Link
      href={`/admin/reservations/${reservation.id}`}
      className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:bg-slate-50"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <SourceBadge source={reservation.source} />

            {showDate ? (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                {reservation.reservationDate}
              </span>
            ) : null}

            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700 ring-1 ring-blue-200">
              {reservation.experienceTime || "미정"}
            </span>
          </div>

          <p className="mt-3 text-base font-bold text-slate-900">
            {reservation.name}
          </p>
          <p className="mt-1 text-sm text-slate-500">{reservation.phone}</p>
        </div>

        <StatusBadge status={reservation.status} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-500">프로그램</p>
          <p className="mt-1 font-bold text-slate-900">
            {reservation.program}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs font-semibold text-slate-500">인원</p>
          <p className="mt-1 font-bold text-slate-900">
            {reservation.people}명
          </p>
        </div>
      </div>
    </Link>
  );
}

function EmptyBox({ message }: { message: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}