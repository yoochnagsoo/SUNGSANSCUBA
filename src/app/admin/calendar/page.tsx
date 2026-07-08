"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type ReservationStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

type Reservation = {
  id: string;
  name: string;
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
  PENDING: "border-amber-200 bg-amber-50 text-amber-800",
  CONFIRMED: "border-blue-200 bg-blue-50 text-blue-800",
  CANCELLED: "border-rose-200 bg-rose-50 text-rose-800",
  COMPLETED: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
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

function sortReservationsByTime(reservations: Reservation[]) {
  return [...reservations].sort((a, b) => {
    const timeA = getTimeValue(a.experienceTime);
    const timeB = getTimeValue(b.experienceTime);

    if (timeA !== timeB) {
      return timeA - timeB;
    }

    const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

    return createdA - createdB;
  });
}

export default function AdminCalendarPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDate = new Date(year, month, 1);
    const lastDate = new Date(year, month + 1, 0);

    const firstDay = firstDate.getDay();
    const lastDay = lastDate.getDate();

    const days: Array<{
      date: Date;
      dateKey: string;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    const todayKey = toDateKey(new Date());

    for (let i = firstDay - 1; i >= 0; i -= 1) {
      const date = new Date(year, month, -i);
      const dateKey = toDateKey(date);

      days.push({
        date,
        dateKey,
        isCurrentMonth: false,
        isToday: dateKey === todayKey,
      });
    }

    for (let day = 1; day <= lastDay; day += 1) {
      const date = new Date(year, month, day);
      const dateKey = toDateKey(date);

      days.push({
        date,
        dateKey,
        isCurrentMonth: true,
        isToday: dateKey === todayKey,
      });
    }

    while (days.length % 7 !== 0) {
      const last = days[days.length - 1].date;
      const date = new Date(last);
      date.setDate(last.getDate() + 1);

      const dateKey = toDateKey(date);

      days.push({
        date,
        dateKey,
        isCurrentMonth: false,
        isToday: dateKey === todayKey,
      });
    }

    return days;
  }, [year, month]);

  const reservationsByDate = useMemo(() => {
    const map = new Map<string, Reservation[]>();

    for (const reservation of reservations) {
      const dateKey = reservation.reservationDate;

      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }

      map.get(dateKey)?.push(reservation);
    }

    for (const [dateKey, items] of map.entries()) {
      map.set(dateKey, sortReservationsByTime(items));
    }

    return map;
  }, [reservations]);

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
          throw new Error(data.message || "예약 목록을 불러오지 못했습니다.");
        }

        setReservations(data.reservations || []);
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

  function goPrevMonth() {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function goNextMonth() {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  function goToday() {
    setCurrentDate(new Date());
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">관리자</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            예약 캘린더
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            날짜별 예약을 체험시간 순서로 확인합니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={goPrevMonth}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            이전달
          </button>

          <button
            type="button"
            onClick={goToday}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            오늘
          </button>

          <button
            type="button"
            onClick={goNextMonth}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            다음달
          </button>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold text-slate-900">
            {year}년 {month + 1}월
          </h2>

          <div className="flex flex-wrap gap-2">
            {Object.entries(STATUS_LABEL).map(([status, label]) => (
              <div
                key={status}
                className={`rounded-full border px-3 py-1 text-xs font-bold ${
                  STATUS_STYLE[status as ReservationStatus]
                }`}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-5 rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
            예약 캘린더를 불러오는 중입니다.
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <div className="min-w-[980px]">
              <div className="grid grid-cols-7 border-y border-slate-200 bg-slate-50">
                {DAY_NAMES.map((dayName, index) => (
                  <div
                    key={dayName}
                    className={`px-3 py-3 text-center text-sm font-bold ${
                      index === 0
                        ? "text-rose-500"
                        : index === 6
                          ? "text-blue-500"
                          : "text-slate-600"
                    }`}
                  >
                    {dayName}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 border-l border-slate-200">
                {calendarDays.map((day) => {
                  const dayReservations =
                    reservationsByDate.get(day.dateKey) || [];

                  return (
                    <div
                      key={day.dateKey}
                      className={`min-h-40 border-b border-r border-slate-200 p-2 ${
                        day.isCurrentMonth ? "bg-white" : "bg-slate-50"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
                            day.isToday
                              ? "bg-blue-600 text-white"
                              : day.isCurrentMonth
                                ? "text-slate-800"
                                : "text-slate-400"
                          }`}
                        >
                          {day.date.getDate()}
                        </span>

                        {dayReservations.length > 0 ? (
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-500">
                            {dayReservations.length}건
                          </span>
                        ) : null}
                      </div>

                      <div className="space-y-1.5">
                        {dayReservations.map((reservation) => (
                          <Link
                            key={reservation.id}
                            href={`/admin/reservations/${reservation.id}`}
                            className={`block rounded-xl border px-2 py-2 text-xs font-semibold leading-5 transition hover:scale-[1.01] hover:shadow-sm ${
                              STATUS_STYLE[reservation.status]
                            }`}
                          >
                            <div className="flex items-center gap-1">
                              <span className="shrink-0 font-black">
                                {reservation.experienceTime || "미정"}
                              </span>
                              <span className="truncate">
                                {reservation.name}
                              </span>
                            </div>

                            <div className="mt-0.5 truncate opacity-80">
                              {reservation.people}명 ·{" "}
                              {STATUS_LABEL[reservation.status]}
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}