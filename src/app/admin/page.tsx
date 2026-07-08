import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  ClipboardList,
  Users,
} from "lucide-react";

const stats = [
  {
    label: "오늘 예약",
    value: "0",
    icon: CalendarDays,
  },
  {
    label: "예약 대기",
    value: "0",
    icon: Clock,
  },
  {
    label: "확정 예약",
    value: "0",
    icon: CheckCircle2,
  },
  {
    label: "전체 고객",
    value: "0",
    icon: Users,
  },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold text-slate-900">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          예약 현황과 운영 상태를 한눈에 확인합니다.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">
                  {stat.label}
                </p>
                <div className="rounded-xl bg-cyan-50 p-2 text-cyan-600">
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              <p className="mt-4 text-3xl font-bold text-slate-900">
                {stat.value}
              </p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              최근 예약
            </h2>

            <Link
              href="/admin/reservations"
              className="text-sm font-semibold text-cyan-600 hover:text-cyan-700"
            >
              전체보기
            </Link>
          </div>

          <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-10 text-center">
            <ClipboardList className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">
              아직 표시할 예약 데이터가 없습니다.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            빠른 이동
          </h2>

          <div className="mt-5 space-y-3">
            <Link
              href="/admin/reservations"
              className="block rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              예약 관리
            </Link>

            <Link
              href="/admin/calendar"
              className="block rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              캘린더 보기
            </Link>

            <Link
              href="/admin/customers"
              className="block rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              고객 관리
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}