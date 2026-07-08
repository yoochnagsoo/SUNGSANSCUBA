import type {
  Reservation,
  ReservationInput,
  ReservationUpdateInput,
} from "./types";

const reservations: Reservation[] = [];

function createId() {
  return crypto.randomUUID();
}

export const memoryReservationRepository = {
  async create(input: ReservationInput): Promise<Reservation> {
    const now = new Date().toISOString();
    const reservationDate = String(input.reservationDate ?? input.date ?? "");

    const reservation: Reservation = {
      id: createId(),

      name: input.name,
      email: input.email,
      phone: input.phone,
      program: input.program,

      reservationDate,
      date: reservationDate,

      people: input.people,
      message: input.message ?? "",

      status: input.status ?? "PENDING",
      adminMemo: "",

      createdAt: now,
      updatedAt: now,
    };

    reservations.unshift(reservation);

    return reservation;
  },

  async findAll(): Promise<Reservation[]> {
    return reservations;
  },

  async findById(id: string): Promise<Reservation | null> {
    return reservations.find((reservation) => reservation.id === id) ?? null;
  },

  async update(
    id: string,
    input: ReservationUpdateInput
  ): Promise<Reservation | null> {
    const index = reservations.findIndex(
      (reservation) => reservation.id === id
    );

    if (index === -1) {
      return null;
    }

    const updated: Reservation = {
      ...reservations[index],
      ...input,
      updatedAt: new Date().toISOString(),
    };

    reservations[index] = updated;

    return updated;
  },

  async delete(id: string): Promise<boolean> {
    const index = reservations.findIndex(
      (reservation) => reservation.id === id
    );

    if (index === -1) {
      return false;
    }

    reservations.splice(index, 1);
    return true;
  },
};