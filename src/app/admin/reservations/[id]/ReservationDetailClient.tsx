"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Mail,
  Phone,
  Save,
  UserRound,
  Users,
} from "lucide-react";
import type { Reservation, ReservationStatus } from "@/types/reservation";
import ReservationStatusBadge from "@/components/admin/ReservationStatusBadge";

const statusOptions: {
  label: string;
  value: ReservationStatus;
}[] = [
  { label: "대기", value: "pending" },
  { label: "확정", value: "confirmed" },
  { label: "취소", value: "cancelled" },
  { label: "완료", value: "completed" },
];

function formatDate(date?: string) {
  if (!date) return "-";

  const d = new Date(date);

  if (Number.isNaN(d.getTime())) return date;

  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
  });
}

export default function ReservationDetailClient({
  reservation,
}: {
  reservation: Reservation | null;
}) {
  const router = useRouter();

  const [status, setStatus] = useState<ReservationStatus>(
    reservation?.status ?? "pending"
  );
  const [adminMemo, setAdminMemo] = useState(reservation?.adminMemo ?? "");
  const [saving, setSaving] = useState(false);

  if (!reservation) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="text-lg font-bold text-slate-900">
          예약 정보를 찾을 수 없습니다.
        </p>

        <Link
          href="/admin/reservations"
          className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-slate-700"
        >
          예약 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  async function handleSave() {
    if (!reservation) return;

    try {
      setSaving(true);

      const res = await fetch(`/api/reservations/${reservation.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          adminMemo,
        }),
      });

      if (!res.ok) {
        alert("저장 중 오류가 발생했습니다.");
        return;
      }

      alert("저장되었습니다.");
      router.refresh();
    } catch {
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link
            href="/admin/reservations"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            예약 목록
          </Link>

          <h1 className="mt-3 text-2xl font-bold text-slate-900">
            예약 상세
          </h1>
        </div>

        <ReservationStatusBadge status={status} />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              예약자 정보
            </h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <InfoCard
                icon={<UserRound className="h-5 w-5" />}
                label="이름"
                value={reservation.name}
              />

              <InfoCard
                icon={<Phone className="h-5 w-5" />}
                label="전화번호"
                value={reservation.phone}
              />

              <InfoCard
                icon={<Mail className="h-5 w-5" />}
                label="이메일"
                value={reservation.email || "-"}
              />

              <InfoCard
                icon={<Users className="h-5 w-5" />}
                label="인원"
                value={`${reservation.people}명`}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              예약 내용
            </h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <InfoCard
                icon={<CalendarDays className="h-5 w-5" />}
                label="예약일"
                value={formatDate(reservation.date)}
              />

              <InfoCard
                icon={<Clock className="h-5 w-5" />}
                label="시간"
                value={reservation.time || "시간 미정"}
              />

              <div className="rounded-xl border border-slate-200 p-4 sm:col-span-2">
                <p className="text-sm font-semibold text-slate-500">
                  프로그램
                </p>
                <p className="mt-2 text-base font-bold text-slate-900">
                  {reservation.program || "-"}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 sm:col-span-2">
                <p className="text-sm font-semibold text-slate-500">
                  고객 요청사항
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">
                  {reservation.memo || "요청사항 없음"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              관리자 처리
            </h2>

            <div className="mt-5">
              <label className="text-sm font-bold text-slate-700">
                예약 상태
              </label>

              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as ReservationStatus)
                }
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5">
              <label className="text-sm font-bold text-slate-700">
                관리자 메모
              </label>

              <textarea
                value={adminMemo}
                onChange={(e) => setAdminMemo(e.target.value)}
                rows={8}
                placeholder="상담 내용, 입금 여부, 특이사항 등을 기록하세요."
                className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? "저장 중..." : "저장하기"}
            </button>
          </div>
        </aside>
      </section>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}
        <p className="text-sm font-semibold">{label}</p>
      </div>

      <p className="mt-3 text-base font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}