"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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

type ReservationResponse = {
  ok: boolean;
  reservation?: Reservation;
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

export default function AdminReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [reservationId, setReservationId] = useState("");
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [status, setStatus] = useState<ReservationStatus>("PENDING");
  const [adminMemo, setAdminMemo] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function resolveParams() {
      const resolvedParams = await params;
      setReservationId(resolvedParams.id);
    }

    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!reservationId) {
      return;
    }

    async function loadReservation() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const response = await fetch(`/api/reservations/${reservationId}`, {
          cache: "no-store",
        });

        const data = (await response.json()) as ReservationResponse;

        if (!response.ok || !data.ok || !data.reservation) {
          throw new Error(data.message ?? "예약 정보를 불러오지 못했습니다.");
        }

        setReservation(data.reservation);
        setStatus(data.reservation.status);
        setAdminMemo(data.reservation.adminMemo ?? "");
      } catch (error) {
        console.error(error);
        setErrorMessage("예약 상세 정보를 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    }

    loadReservation();
  }, [reservationId]);

  async function handleSave() {
    if (!reservation) {
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await fetch(`/api/reservations/${reservation.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          adminMemo,
        }),
      });

      const data = (await response.json()) as ReservationResponse;

      if (!response.ok || !data.ok || !data.reservation) {
        throw new Error(data.message ?? "예약 정보를 수정하지 못했습니다.");
      }

      setReservation(data.reservation);
      setStatus(data.reservation.status);
      setAdminMemo(data.reservation.adminMemo ?? "");
      setSuccessMessage("예약 정보가 저장되었습니다.");
    } catch (error) {
      console.error(error);
      setErrorMessage("예약 정보를 저장하지 못했습니다.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <main className="p-6 sm:p-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
          예약 상세 정보를 불러오는 중입니다.
        </div>
      </main>
    );
  }

  if (!reservation) {
    return (
      <main className="p-6 sm:p-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-sm font-medium text-red-700">
          {errorMessage || "예약 정보를 찾을 수 없습니다."}
        </div>

        <Link
          href="/admin/reservations"
          className="mt-6 inline-flex rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
        >
          예약 목록으로 돌아가기
        </Link>
      </main>
    );
  }

  const displayReservationDate =
    reservation.reservationDate || reservation.date || "-";

  const customerMessage =
    reservation.message && reservation.message.trim()
      ? reservation.message
      : "고객 요청사항이 없습니다.";

  return (
    <main className="p-6 sm:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-cyan-600">Reservation</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            예약 상세
          </h1>
        </div>

        <Link
          href="/admin/reservations"
          className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          목록으로
        </Link>
      </div>

      {errorMessage && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {successMessage}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {reservation.name}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                예약번호: {reservation.id}
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ring-1 ${
                statusClassNames[reservation.status]
              }`}
            >
              {statusLabels[reservation.status]}
            </span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <DetailItem label="프로그램" value={reservation.program} />
            <DetailItem label="예약일자" value={displayReservationDate} />
            <DetailItem label="인원" value={`${reservation.people}명`} />
            <DetailItem label="연락처" value={reservation.phone} />
            <DetailItem label="이메일" value={reservation.email} />
            <DetailItem label="접수일시" value={formatDateTime(reservation.createdAt)} />
          </div>

          <div className="mt-8">
            <h3 className="mb-3 text-sm font-bold text-slate-900">
              고객 요청사항
            </h3>
            <div className="min-h-32 whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              {customerMessage}
            </div>
          </div>
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">관리자 처리</h2>

          <div className="mt-5">
            <label
              htmlFor="status"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              예약 상태
            </label>
            <select
              id="status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as ReservationStatus)
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            >
              <option value="PENDING">대기</option>
              <option value="CONFIRMED">확정</option>
              <option value="CANCELLED">취소</option>
              <option value="COMPLETED">완료</option>
            </select>
          </div>

          <div className="mt-5">
            <label
              htmlFor="adminMemo"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              관리자 메모
            </label>
            <textarea
              id="adminMemo"
              value={adminMemo}
              onChange={(event) => setAdminMemo(event.target.value)}
              rows={8}
              className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              placeholder="상담 내용, 입금 여부, 장비 사이즈 등을 기록하세요."
            />
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="mt-6 w-full rounded-xl bg-cyan-600 px-4 py-3 text-sm font-bold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSaving ? "저장 중..." : "저장하기"}
          </button>
        </aside>
      </div>
    </main>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 break-words text-sm font-semibold text-slate-900">
        {value || "-"}
      </p>
    </div>
  );
}