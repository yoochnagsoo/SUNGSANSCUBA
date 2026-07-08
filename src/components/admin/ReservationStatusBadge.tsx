import type { ReservationStatus } from "@/types/reservation";

const statusMap: Record<
  ReservationStatus,
  {
    label: string;
    className: string;
  }
> = {
  pending: {
    label: "대기",
    className: "bg-amber-100 text-amber-700",
  },
  confirmed: {
    label: "확정",
    className: "bg-cyan-100 text-cyan-700",
  },
  cancelled: {
    label: "취소",
    className: "bg-rose-100 text-rose-700",
  },
  completed: {
    label: "완료",
    className: "bg-emerald-100 text-emerald-700",
  },
};

export default function ReservationStatusBadge({
  status,
}: {
  status: ReservationStatus;
}) {
  const item = statusMap[status] ?? statusMap.pending;

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${item.className}`}
    >
      {item.label}
    </span>
  );
}