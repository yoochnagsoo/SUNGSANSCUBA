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
  return reservation.reservationDate || reservation.date || "-";
}

function isToday(value?: string) {
  if (!value) {
    return false;
  }

  const today = new Date();
  const target = new Date(value);

  if (Number.isNaN(target.getTime())) {
    return value === today.toISOString().slice(0, 10);
  }

  return target.toISOString().slice(0, 10) === today.toISOString().slice(0, 10);
}

function formatDateTime(value?: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function AdminDashboardPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
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
      console.error("[AdminDashboardPage] loadReservations error:", error);
      setErrorMessage("대시보드 데이터를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadReservations();
  }, []);

  const stats = useMemo(() => {
    const total = reservations.length;
    const pending = reservations.filter((item) => item.status === "PENDING").length;
    const confirmed = reservations.filter(
      (item) => item.status === "CONFIRMED"
    ).length;
    const today = reservations.filter((item) =>
      isToday(getReservationDate(item))
    ).length;

    return {
      total,
      pending,
      confirmed,
      today,
    };
  }, [reservations]);

  const recentReservations = reservations.slice(0, 6);

  return (
    <main className="p-6 sm:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-cyan-600">Dashboard</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            관리자 대시보드
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            예약 현황과 최근 접수 내역을 확인합니다.
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="전체 예약" value={`${stats.total}건`} />
        <StatCard label="대기 예약" value={`${stats.pending}건`} />
        <StatCard label="확정 예약" value={`${stats.confirmed}건`} />
        <StatCard label="오늘 예약" value={`${stats.today}건`} />
      </div>

      <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-bold text-slate-900">최근 예약</h2>
          <Link
            href="/admin/reservations"
            className="text-sm font-semibold text-cyan-700 hover:text-cyan-800"
          >
            전체 보기
          </Link>
        </div>

        {isLoading ? (
          <div className="p-8 text-sm text-slate-500">
            대시보드 데이터를 불러오는 중입니다.
          </div>
        ) : recentReservations.length === 0 ? (
          <div className="p-8 text-sm text-slate-500">
            아직 접수된 예약이 없습니다.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentReservations.map((reservation) => (
              <Link
                key={reservation.id}
                href={`/admin/reservations/${reservation.id}`}
                className="block px-5 py-4 hover:bg-slate-50"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900">
                        {reservation.name}
                      </p>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${
                          statusClassNames[reservation.status]
                        }`}
                      >
                        {statusLabels[reservation.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {reservation.program} · {getReservationDate(reservation)} ·{" "}
                      {reservation.people}명
                    </p>
                  </div>

                  <p className="text-xs text-slate-400">
                    {formatDateTime(reservation.createdAt)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}