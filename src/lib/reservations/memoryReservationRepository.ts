import type {
  Reservation,
  ReservationInput,
  ReservationListOptions,
  ReservationListResult,
  ReservationRepository,
  ReservationSource,
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

function normalizeSource(source?: ReservationSource): ReservationSource {
  if (source === "ADMIN") {
    return "ADMIN";
  }

  return "CUSTOMER";
}

function getReservationDate(reservation: Reservation) {
  return reservation.reservationDate || reservation.date || "";
}

function getReservationTime(reservation: Reservation) {
  return reservation.experienceTime || "";
}

function normalizeReservation(reservation: Reservation): Reservation {
  return {
    ...reservation,
    source: normalizeSource(reservation.source),
  };
}

function sortReservations(items: Reservation[]) {
  return [...items].sort((a, b) => {
    const dateA = getReservationDate(a);
    const dateB = getReservationDate(b);

    const dateCompare = dateB.localeCompare(dateA);

    if (dateCompare !== 0) {
      return dateCompare;
    }

    const timeA = getReservationTime(a);
    const timeB = getReservationTime(b);

    const timeCompare = timeA.localeCompare(timeB);

    if (timeCompare !== 0) {
      return timeCompare;
    }

    const createdA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const createdB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

    return createdB - createdA;
  });
}

function filterReservations(
  items: Reservation[],
  options?: ReservationListOptions,
) {
  let nextItems = [...items];

  if (options?.status && options.status !== "ALL") {
    nextItems = nextItems.filter(
      (reservation) => reservation.status === options.status,
    );
  }

  if (options?.keyword) {
    const keyword = options.keyword.trim().toLowerCase();

    if (keyword) {
      nextItems = nextItems.filter((reservation) => {
        return [
          reservation.name,
          reservation.phone,
          reservation.email,
          reservation.program,
          reservation.message,
          reservation.adminMemo,
          reservation.source,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
      });
    }
  }

  return nextItems;
}

export const memoryReservationRepository: ReservationRepository = {
  async create(input: ReservationInput) {
    const now = new Date().toISOString();
    const reservationDate = String(input.reservationDate ?? input.date ?? "");

    const reservation: Reservation = {
      id: createId(),

      source: normalizeSource(input.source),

      name: input.name,
      email: input.email || "",
      phone: input.phone,
      program: input.program,

      reservationDate,
      date: reservationDate,

      experienceTime: input.experienceTime || "",

      people: Number(input.people || 1),
      message: input.message || "",

      status: input.status || "PENDING",
      adminMemo: input.adminMemo || "",

      paymentAmount: input.paymentAmount,
      paymentMethod: input.paymentMethod,
      paymentMemo: input.paymentMemo,
      completedAt: input.completedAt,

      createdAt: now,
      updatedAt: now,
    };

    reservations.push(reservation);

    return normalizeReservation(reservation);
  },

  async findAll() {
    return sortReservations(reservations).map(normalizeReservation);
  },

  async findPaginated(
    options: ReservationListOptions,
  ): Promise<ReservationListResult> {
    const limit = normalizeLimit(options.limit);
    const cursor = options.cursor ? Number(options.cursor) : 0;
    const startIndex = Number.isFinite(cursor) && cursor > 0 ? cursor : 0;

    const filteredItems = filterReservations(reservations, options);
    const sortedItems = sortReservations(filteredItems);

    const items = sortedItems.slice(startIndex, startIndex + limit);
    const nextIndex = startIndex + limit;
    const nextCursor =
      nextIndex < sortedItems.length ? String(nextIndex) : undefined;

    return {
      reservations: items.map(normalizeReservation),
      nextCursor,
    };
  },

  async findById(id: string) {
    const reservation = reservations.find((item) => item.id === id);

    if (!reservation) {
      return null;
    }

    return normalizeReservation(reservation);
  },

  async update(id: string, input: ReservationUpdateInput) {
    const index = reservations.findIndex((item) => item.id === id);

    if (index === -1) {
      return null;
    }

    const prev = reservations[index];

    const reservationDate =
      input.reservationDate !== undefined || input.date !== undefined
        ? String(input.reservationDate ?? input.date ?? "")
        : prev.reservationDate;

    const updated: Reservation = {
      ...prev,

      source: normalizeSource(input.source ?? prev.source),

      name: input.name ?? prev.name,
      email: input.email ?? prev.email,
      phone: input.phone ?? prev.phone,
      program: input.program ?? prev.program,

      reservationDate,
      date: reservationDate,

      experienceTime: input.experienceTime ?? prev.experienceTime,

      people:
        input.people !== undefined ? Number(input.people || 1) : prev.people,
      message: input.message ?? prev.message,

      status: input.status ?? prev.status,
      adminMemo: input.adminMemo ?? prev.adminMemo,

      paymentAmount: input.paymentAmount ?? prev.paymentAmount,
      paymentMethod: input.paymentMethod ?? prev.paymentMethod,
      paymentMemo: input.paymentMemo ?? prev.paymentMemo,
      completedAt: input.completedAt ?? prev.completedAt,

      updatedAt: new Date().toISOString(),
    };

    reservations[index] = updated;

    return normalizeReservation(updated);
  },

  async delete(id: string) {
    const index = reservations.findIndex((item) => item.id === id);

    if (index === -1) {
      return false;
    }

    reservations.splice(index, 1);

    return true;
  },
};