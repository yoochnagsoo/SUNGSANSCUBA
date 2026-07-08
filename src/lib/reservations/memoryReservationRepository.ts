import { randomUUID } from "crypto";
import type { Reservation } from "@/types/reservation";
import type {
  CreateReservationInput,
  ReservationRepository,
  UpdateReservationInput,
} from "./types";

const reservations: Reservation[] = [];

export const memoryReservationRepository: ReservationRepository = {
  async listReservations() {
    return reservations;
  },

  async getReservationById(id: string) {
    return reservations.find((item) => item.id === id) ?? null;
  },

  async createReservation(input: CreateReservationInput) {
    const now = new Date().toISOString();

    const reservation: Reservation = {
      id: randomUUID(),
      name: input.name,
      phone: input.phone,
      email: input.email,
      program: input.program,
      date: input.date,
      time: input.time,
      people: input.people,
      memo: input.memo,
      adminMemo: "",
      status: "pending",
      createdAt: now,
    };

    reservations.unshift(reservation);

    return reservation;
  },

  async updateReservation(
    id: string,
    input: UpdateReservationInput
  ) {
    const index = reservations.findIndex((item) => item.id === id);

    if (index === -1) return null;

    reservations[index] = {
      ...reservations[index],
      status: input.status ?? reservations[index].status,
      adminMemo: input.adminMemo ?? reservations[index].adminMemo,
    };

    return reservations[index];
  },
};