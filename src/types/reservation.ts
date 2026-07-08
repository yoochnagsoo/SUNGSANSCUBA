export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

export type Reservation = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  program?: string;
  date: string;
  time?: string;
  people: number;
  status: ReservationStatus;
  memo?: string;
  adminMemo?: string;
  createdAt?: string;
};