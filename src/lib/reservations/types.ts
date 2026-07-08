import type { Reservation, ReservationStatus } from "@/types/reservation";

export type CreateReservationInput = {
  name: string;
  phone: string;
  email?: string;
  program?: string;
  date: string;
  time?: string;
  people: number;
  memo?: string;
};

export type UpdateReservationInput = {
  status?: ReservationStatus;
  adminMemo?: string;
};

export type ReservationRepository = {
  listReservations: () => Promise<Reservation[]>;
  getReservationById: (id: string) => Promise<Reservation | null>;
  createReservation: (
    input: CreateReservationInput
  ) => Promise<Reservation>;
  updateReservation: (
    id: string,
    input: UpdateReservationInput
  ) => Promise<Reservation | null>;
};