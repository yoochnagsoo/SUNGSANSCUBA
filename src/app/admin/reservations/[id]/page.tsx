"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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

const STATUS_OPTIONS: ReservationStatus[] = [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
];

const EXPERIENCE_TIME_OPTIONS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
];

export default function AdminReservationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const reservationId = params.id;

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [status, setStatus] = useState<ReservationStatus>("PENDING");
  const [adminMemo, setAdminMemo] = useState("");
  const [experienceTime, setExperienceTime] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const createdAtText = useMemo(() => {
    if (!reservation?.createdAt) return "-";

    const date = new Date(reservation.createdAt);

    if (Number.isNaN(date.getTime())) {
      return reservation.createdAt;
    }

    return date.toLocaleString("ko-KR");
  }, [reservation]);

  useEffect(() => {
    async function fetchReservation() {
      try {
        setLoading(true);
        setErrorMessage("");

        const res = await fetch(`/api/reservations/${reservationId}`, {
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok || !data.ok) {
          throw new Error(data.message || "예약 정보를 불러오지 못했습니다.");
        }

        const item = data.reservation as Reservation;

        setReservation(item);
        setStatus(item.status || "PENDING");
        setAdminMemo(item.adminMemo || "");
        setExperienceTime(item.experienceTime || "");
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

    if (reservationId) {
      fetchReservation();
    }
  }, [reservationId]);

  async function handleSave() {
    try {
      setSaving(true);
      setErrorMessage("");

      const res = await fetch(`/api/reservations/${reservationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          adminMemo,
          experienceTime: experienceTime || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "예약 정보를 저장하지 못했습니다.");
      }

      const updated = data.reservation as Reservation;

      setReservation(updated);
      setStatus(updated.status || "PENDING");
      setAdminMemo(updated.adminMemo || "");
      setExperienceTime(updated.experienceTime || "");

      alert("예약 정보가 저장되었습니다.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "예약 정보를 저장하지 못했습니다.";

      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">예약 정보를 불러오는 중입니다.</p>
        </div>
      </div>
    );
  }

  if (errorMessage && !reservation) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="font-semibold text-red-700">오류</p>
          <p className="mt-2 text-sm text-red-600">{errorMessage}</p>

          <button
            type="button"
            onClick={() => router.back()}
            className="mt-5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            뒤로가기
          </button>
        </div>
      </div>
    );
  }

  if (!reservation) {
    return null;
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">예약 상세</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            {reservation.name}
          </h1>
        </div>

        <button
          type="button"
          onClick={() => router.push("/admin/reservations")}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          목록으로
        </button>
      </div>

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">예약 정보</h2>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <InfoItem label="이름" value={reservation.name} />
            <InfoItem label="연락처" value={reservation.phone} />
            <InfoItem label="프로그램" value={reservation.program} />
            <InfoItem label="예약 희망일" value={reservation.reservationDate} />
            <InfoItem label="인원" value={`${reservation.people}명`} />
            <InfoItem label="접수일시" value={createdAtText} />
          </div>

          <div className="mt-6">
            <p className="text-sm font-semibold text-slate-500">요청사항</p>
            <div className="mt-2 min-h-28 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              {reservation.message?.trim()
                ? reservation.message
                : "요청사항이 없습니다."}
            </div>
          </div>
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">관리자 처리</h2>

          <div className="mt-5 space-y-5">
            <div>
              <label className="text-sm font-semibold text-slate-600">
                예약 상태
              </label>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as ReservationStatus)
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                {STATUS_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {STATUS_LABEL[item]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-600">
                체험시간
              </label>

              <select
                value={experienceTime}
                onChange={(event) => setExperienceTime(event.target.value)}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                <option value="">시간 미지정</option>

                {EXPERIENCE_TIME_OPTIONS.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>

              <p className="mt-2 text-xs text-slate-500">
                예약시간은 30분 단위로만 선택됩니다.
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-600">
                관리자 메모
              </label>

              <textarea
                value={adminMemo}
                onChange={(event) => setAdminMemo(event.target.value)}
                rows={7}
                placeholder="관리자용 메모를 입력하세요."
                className="mt-2 w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {saving ? "저장 중..." : "저장하기"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 break-words text-base font-bold text-slate-900">
        {value || "-"}
      </p>
    </div>
  );
}