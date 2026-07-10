import type {
  BoatSchedule,
  BoatScheduleInput,
  BoatScheduleRepository,
  BoatScheduleUpdateInput,
} from "./types";

const schedules: BoatSchedule[] = [];

function createId() {
  return crypto.randomUUID();
}

function normalizePassengerCapacity(value: unknown) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 11;
  }

  return Math.min(Math.max(Math.floor(parsed), 1), 11);
}

function sortSchedules(items: BoatSchedule[]) {
  return [...items].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }

    if (a.departureTime !== b.departureTime) {
      return a.departureTime.localeCompare(b.departureTime);
    }

    return a.createdAt.localeCompare(b.createdAt);
  });
}

export const memoryBoatScheduleRepository: BoatScheduleRepository = {
  async create(input: BoatScheduleInput) {
    const now = new Date().toISOString();

    const schedule: BoatSchedule = {
      id: createId(),

      date: input.date,
      departureTime: input.departureTime,

      boatName: input.boatName ?? "SUNG SAN SCUBA",
      plannedPointName: input.plannedPointName ?? "",
      actualPointName: input.actualPointName ?? "",

      passengerCapacity: normalizePassengerCapacity(
        input.passengerCapacity,
      ),

      status: input.status ?? "SCHEDULED",
      memo: input.memo ?? "",

      createdAt: now,
      updatedAt: now,
    };

    schedules.push(schedule);

    return schedule;
  },

  async findAll() {
    return sortSchedules(schedules);
  },

  async findById(id: string) {
    return schedules.find((schedule) => schedule.id === id) ?? null;
  },

  async update(id: string, input: BoatScheduleUpdateInput) {
    const index = schedules.findIndex((schedule) => schedule.id === id);

    if (index === -1) {
      return null;
    }

    const previous = schedules[index];

    const updated: BoatSchedule = {
      ...previous,

      date: input.date ?? previous.date,
      departureTime:
        input.departureTime ?? previous.departureTime,

      boatName: input.boatName ?? previous.boatName,
      plannedPointName:
        input.plannedPointName ?? previous.plannedPointName,
      actualPointName:
        input.actualPointName ?? previous.actualPointName,

      passengerCapacity:
        typeof input.passengerCapacity !== "undefined"
          ? normalizePassengerCapacity(input.passengerCapacity)
          : previous.passengerCapacity,

      status: input.status ?? previous.status,
      memo: input.memo ?? previous.memo,

      updatedAt: new Date().toISOString(),
    };

    schedules[index] = updated;

    return updated;
  },

  async delete(id: string) {
    const index = schedules.findIndex((schedule) => schedule.id === id);

    if (index === -1) {
      return false;
    }

    schedules.splice(index, 1);

    return true;
  },
};
