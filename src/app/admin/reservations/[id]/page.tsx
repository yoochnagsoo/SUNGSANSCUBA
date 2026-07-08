import ReservationDetailClient from "./ReservationDetailClient";
import type { Reservation } from "@/types/reservation";

async function getReservation(id: string): Promise<Reservation | null> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const res = await fetch(`${baseUrl}/api/reservations/${id}`, {
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = await res.json();

    return data.reservation ?? data;
  } catch {
    return null;
  }
}

export default async function AdminReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const reservation = await getReservation(id);

  return <ReservationDetailClient reservation={reservation} />;
}