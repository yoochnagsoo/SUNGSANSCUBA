export type ReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED";

export type Reservation = {
  id: string;

  name: string;
  email: string;
  phone: string;
  program: string;

  reservationDate: string;
  date: string;

  experienceTime?: string;

  people: number;
  message?: string;

  status: ReservationStatus;
  adminMemo?: string;

  createdAt: string;
  updatedAt: string;
};

export type ReservationInput = {
  name: string;
  email: string;
  phone: string;
  program: string;

  reservationDate?: string;
  date?: string;

  experienceTime?: string;

  people: number;
  message?: string;

  status?: ReservationStatus;
};

export type ReservationUpdateInput = Partial<
  Pick<Reservation, "status" | "adminMemo" | "experienceTime">
>;

export type ReservationListOptions = {
  limit?: number;
  cursor?: string;
  status?: ReservationStatus | "ALL";
  keyword?: string;
};

export type ReservationListResult = {
  reservations: Reservation[];
  nextCursor?: string;
};