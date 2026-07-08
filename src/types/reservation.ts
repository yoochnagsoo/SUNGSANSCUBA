export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

export type Reservation = {
  id: string;
  name: string;
  phone: string;
  email: string;
  program: string;
  date: string;
  time?: string;
  people: number;

  // 고객 요청사항
  message?: string;
  memo?: string;

  status: ReservationStatus;
  adminMemo?: string;

  notificationStatus?: string;
  notificationType?: string;
  notificationSentAt?: string;
  notificationError?: string;

  createdAt?: string;
  updatedAt?: string;
};