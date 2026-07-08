import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import type { Reservation } from "@/types/reservation";
import ReservationStatusBadge from "@/components/admin/ReservationStatusBadge";

async function getReservations(): Promise<Reservation[]> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const res = await fetch(`${baseUrl}/api/reservations`, {
      cache: "no-store",
    });

    if (!res.ok) return [];

    const data = await res.json();

    if (Array.isArray(data)) return data;
    if (Array.isArray(data.reservations)) return data.reservations;

    return [];
  } catch {
    return [];
  }
}

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function normalizeDateKey(value: string) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10);
  }

  return getDateKey(date);
}

function buildCalendar(year: number, month: number) {
  const firstDate = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0);

  const startDay = firstDate.getDay();
  const totalDays = lastDate.getDate();

  const cells: {
    date: Date | null;
    key: string;
  }[] = [];

  for (let i = 0; i < startDay; i++) {
    cells.push({
      date: null,
      key: `empty-start-${i}`,
    });
  }

  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(year, month, day);

    cells.push({
      date,
      key: getDateKey(date),
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({
      date: null,
      key: `empty-end-${cells.length}`,
    });
  }

  return cells;
}

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{
    year?: string;
    month?: string;
  }>;
}) {
  const params = await searchParams;

  const today = new Date();

  const currentYear = Number(params.year) || today.getFullYear();
  const currentMonth =
    params.month !== undefined
      ? Number(params.month) - 1
      : today.getMonth();

  const reservations = await getReservations();

  const reservationMap = reservations.reduce<Record<string, Reservation[]>>(
    (acc, reservation) => {
      const key = normalizeDateKey(reservation.date);

      if (!acc[key]) acc[key] = [];
      acc[key].push(reservation);

      return acc;
    },
    {}
  );

  const cells = buildCalendar(currentYear, currentMonth);

  const prevDate = new Date(currentYear, currentMonth - 1, 1);
  const nextDate = new Date(currentYear, currentMonth + 1, 1);

  const prevHref = `/admin/calendar?year=${prevDate.getFullYear()}&month=${
    prevDate.getMonth() + 1
  }`;

  const nextHref = `/admin/calendar?year=${nextDate.getFullYear()}&month=${
    nextDate.getMonth() + 1
  }`;

  const monthLabel = `${currentYear}년 ${currentMonth + 1}월`;

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            예약 캘린더
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            날짜별 예약 현황을 한눈에 확인합니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={prevHref}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>

          <div className="min-w-36 rounded-xl bg-white px-5 py-2 text-center text-sm font-bold text-slate-800 shadow-sm">
            {monthLabel}
          </div>

          <Link
            href={nextHref}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          >
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
          {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
            <div
              key={day}
              className="px-3 py-3 text-center text-sm font-bold text-slate-600"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((cell) => {
            const dayReservations = cell.date
              ? reservationMap[cell.key] ?? []
              : [];

            return (
              <div
                key={cell.key}
                className={[
                  "min-h-36 border-b border-r border-slate-100 p-3",
                  cell.date ? "bg-white" : "bg-slate-50",
                ].join(" ")}
              >
                {cell.date ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-800">
                        {cell.date.getDate()}
                      </span>

                      {dayReservations.length > 0 && (
                        <span className="rounded-full bg-cyan-100 px-2 py-0.5 text-xs font-bold text-cyan-700">
                          {dayReservations.length}건
                        </span>
                      )}
                    </div>

                    <div className="mt-3 space-y-2">
                      {dayReservations.slice(0, 3).map((reservation) => (
                        <Link
                          key={reservation.id}
                          href={`/admin/reservations/${reservation.id}`}
                          className="block rounded-xl border border-slate-200 bg-slate-50 p-2 hover:bg-cyan-50"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-xs font-bold text-slate-900">
                              {reservation.name}
                            </p>
                            <ReservationStatusBadge
                              status={reservation.status}
                            />
                          </div>

                          <p className="mt-1 truncate text-xs text-slate-500">
                            {reservation.time || "시간 미정"} ·{" "}
                            {reservation.people}명
                          </p>
                        </Link>
                      ))}

                      {dayReservations.length > 3 && (
                        <p className="text-xs font-semibold text-slate-400">
                          외 {dayReservations.length - 3}건
                        </p>
                      )}
                    </div>
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      {reservations.length === 0 && (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <CalendarDays className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-4 text-sm text-slate-500">
            캘린더에 표시할 예약 데이터가 없습니다.
          </p>
        </section>
      )}
    </div>
  );
}