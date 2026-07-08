import type {
  Reservation,
  ReservationInput,
  ReservationListOptions,
  ReservationListResult,
  ReservationUpdateInput,
} from "./types";

const reservations: Reservation[] = [];

function createId() {
  return crypto.randomUUID();
}

function normalizeLimit(limit?: number) {
  if (!limit || !Number.isFinite(limit)) {
    return 50;
  }

  return Math.min(Math.max(Math.floor(limit), 1), 100);
}

function getReservationDate(reservation: Reservation) {
  return reservation.reservationDate || reservation.date || "";
}

function sortReservations(items: Reservation[]) {
  return [...items].sort((a, b) => {
    const createdAtCompare = b.createdAt.localeCompare(a.createdAt);

    if (createdAtCompare !== 0) {
      return createdAtCompare;
    }

    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

function filterReservations(
  items: Reservation[],
  options: ReservationListOptions
) {
  const keyword = options.keyword?.trim().toLowerCase();

  return items.filter((reservation) => {
    if (
      options.status &&
      options.status !== "ALL" &&
      reservation.status !== options.status
    ) {
      return false;
    }

    if (!keyword) {
      return true;
    }

    return (
      reservation.name.toLowerCase().includes(keyword) ||
      reservation.email.toLowerCase().includes(keyword) ||
      reservation.phone.toLowerCase().includes(keyword) ||
      reservation.program.toLowerCase().includes(keyword) ||
      getReservationDate(reservation).toLowerCase().includes(keyword) ||
      String(reservation.experienceTime ?? "")
        .toLowerCase()
        .includes(keyword)
    );
  });
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

      experienceTime: input.experienceTime ?? "",

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
    return sortReservations(reservations);
  },

  async findPaginated(
    options: ReservationListOptions
  ): Promise<ReservationListResult> {
    const limit = normalizeLimit(options.limit);
    const startIndex = Number(options.cursor ?? 0);

    const filtered = sortReservations(filterReservations(reservations, options));
    const page = filtered.slice(startIndex, startIndex + limit);
    const nextIndex = startIndex + limit;

    return {
      reservations: page,
      nextCursor: nextIndex < filtered.length ? String(nextIndex) : undefined,
    };
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