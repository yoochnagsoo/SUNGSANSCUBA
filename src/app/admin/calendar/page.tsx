"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ReservationStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

type Reservation = {
  id: string;
  name: string;
  email: string;
  phone: string;
  program: string;
  reservationDate?: string;
  date?: string;
  people: number;
  message?: string;
  status: ReservationStatus;
  adminMemo?: string;
  createdAt: string;
  updatedAt: string;
};

type ReservationsResponse = {
  ok: boolean;
  reservations?: Reservation[];
  message?: string;
};

const statusLabels: Record<ReservationStatus, string> = {
  PENDING: "대기",
  CONFIRMED: "확정",
  CANCELLED: "취소",
  COMPLETED: "완료",
};

const statusClassNames: Record<ReservationStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 ring-amber-200",
  CONFIRMED: "bg-cyan-50 text-cyan-700 ring-cyan-200",
  CANCELLED: "bg-red-50 text-red-700 ring-red-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

function getReservationDate(reservation: Reservation) {
  return reservation.reservationDate || reservation.date || "";
}

function getMonthKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function getDaysInMonth(currentMonth: Date) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: Date[] = [];

  for (let i = 0; i < firstDay.getDay(); i += 1) {
    days.push(new Date(year, month, i - firstDay.getDay() + 1));
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(new Date(year, month, day));
  }

  while (days.length % 7 !== 0) {
    const last = days[days.length - 1];
    days.push(new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1));
  }

  return days;
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function AdminCalendarPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadReservations() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await fetch("/api/reservations", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await response.json()) as ReservationsResponse;

      if (!response.ok || !data.ok) {
        throw new Error(data.message ?? "예약 목록을 불러오지 못했습니다.");
      }

      setReservations(data.reservations ?? []);
    } catch (error) {
      console.error("[AdminCalendarPage] loadReservations error:", error);
      setErrorMessage("캘린더 데이터를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadReservations();
  }, []);

  const monthDays = useMemo(() => getDaysInMonth(currentMonth), [currentMonth]);

  const reservationsByDate = useMemo(() => {
    return reservations.reduce<Record<string, Reservation[]>>((acc, reservation) => {
      const key = getReservationDate(reservation);

      if (!key) {
        return acc;
      }

      if (!acc[key]) {
        acc[key] = [];
      }

      acc[key].push(reservation);

      return acc;
    }, {});
  }, [reservations]);

  const currentMonthLabel = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
  }).format(currentMonth);

  function moveMonth(amount: number) {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + amount, 1)
    );
  }

  return (
    <main className="p-6 sm:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-cyan-600">Calendar</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">예약 캘린더</h1>
          <p className="mt-2 text-sm text-slate-500">
            날짜별 예약 현황을 확인합니다.
          </p>
        </div>

        <button
          type="button"
          onClick={loadReservations}
          disabled={isLoading}
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "새로고침 중..." : "새로고침"}
        </button>
      </div>

      {errorMessage && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <button
            type="button"
            onClick={() => moveMonth(-1)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            이전
          </button>

          <h2 className="text-lg font-bold text-slate-900">
            {currentMonthLabel}
          </h2>

          <button
            type="button"
            onClick={() => moveMonth(1)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            다음
          </button>
        </div>

        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold text-slate-500">
          {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
            <div key={day} className="px-2 py-3">
              {day}
            </div>
          ))}
        </div>

        {isLoading ? (
          <div className="p-8 text-sm text-slate-500">
            캘린더 데이터를 불러오는 중입니다.
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {monthDays.map((day) => {
              const dateKey = formatDateKey(day);
              const dayReservations = reservationsByDate[dateKey] ?? [];
              const isCurrentMonth = getMonthKey(day) === getMonthKey(currentMonth);

              return (
                <div
                  key={dateKey}
                  className={`min-h-32 border-b border-r border-slate-100 p-2 ${
                    isCurrentMonth ? "bg-white" : "bg-slate-50"
                  }`}
                >
                  <div
                    className={`text-xs font-bold ${
                      isCurrentMonth ? "text-slate-900" : "text-slate-400"
                    }`}
                  >
                    {day.getDate()}
                  </div>

                  <div className="mt-2 space-y-1">
                    {dayReservations.slice(0, 3).map((reservation) => (
                      <Link
                        key={reservation.id}
                        href={`/admin/reservations/${reservation.id}`}
                        className={`block truncate rounded-lg px-2 py-1 text-xs font-semibold ring-1 ${
                          statusClassNames[reservation.status]
                        }`}
                      >
                        {reservation.name} · {reservation.people}명
                      </Link>
                    ))}

                    {dayReservations.length > 3 && (
                      <div className="text-xs font-semibold text-slate-400">
                        +{dayReservations.length - 3}건
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}