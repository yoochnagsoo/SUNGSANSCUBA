import { Reservation, ReservationStatus } from "@/types/reservation";

let reservations: Reservation[] = [];

function getTime(value?: string) {
  return value ? new Date(value).getTime() : 0;
}

export function getReservations() {
  return [...reservations].sort(
    (a, b) => getTime(b.createdAt) - getTime(a.createdAt)
  );
}

export function createReservation(data: {
  name: string;
  phone: string;
  email: string;
  program: string;
  date: string;
  people: string | number;
  message: string;
}) {
  const now = new Date().toISOString();

  const reservation: Reservation = {
    id: crypto.randomUUID(),
    name: data.name,
    phone: data.phone,
    email: data.email,
    program: data.program,
    date: data.date,
    people: Number(data.people),
    message: data.message,
    memo: data.message,

    status: "pending",
    adminMemo: "",

    notificationStatus: "none",

    createdAt: now,
    updatedAt: now,
  };

  reservations = [reservation, ...reservations];

  return reservation;
}

export function updateReservation(
  id: string,
  data: Partial<{
    status: ReservationStatus;
    adminMemo: string;
  }>
) {
  let updated: Reservation | null = null;

  reservations = reservations.map((item) => {
    if (item.id !== id) return item;

    const nextStatus = data.status ?? item.status;

    const shouldSendNotification =
      item.status !== "confirmed" && nextStatus === "confirmed";

    updated = {
      ...item,
      ...data,
      notificationStatus: shouldSendNotification ? "sent" : item.notificationStatus,
      notificationType: shouldSendNotification ? "alimtalk" : item.notificationType,
      notificationSentAt: shouldSendNotification
        ? new Date().toISOString()
        : item.notificationSentAt,
      notificationError: shouldSendNotification ? undefined : item.notificationError,
      updatedAt: new Date().toISOString(),
    };

    return updated;
  });

  return updated;
}

export function deleteReservation(id: string) {
  const before = reservations.length;
  reservations = reservations.filter((item) => item.id !== id);

  return reservations.length < before;
}