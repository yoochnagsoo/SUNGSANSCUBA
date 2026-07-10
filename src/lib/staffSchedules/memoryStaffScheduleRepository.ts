import type {
  StaffSchedule,
  StaffScheduleInput,
  StaffScheduleRepository,
  StaffScheduleUpdateInput,
} from "./types";

const staffSchedules: StaffSchedule[] = [];

function createId() {
  return crypto.randomUUID();
}

function normalizeOptionalText(value?: string) {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim();

  return normalized || undefined;
}

function sortStaffSchedules(items: StaffSchedule[]) {
  return [...items].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);

    if (dateCompare !== 0) {
      return dateCompare;
    }

    const nameCompare = a.staffName.localeCompare(b.staffName);

    if (nameCompare !== 0) {
      return nameCompare;
    }

    return a.createdAt.localeCompare(b.createdAt);
  });
}

export const memoryStaffScheduleRepository: StaffScheduleRepository = {
  async list(): Promise<StaffSchedule[]> {
    return sortStaffSchedules(staffSchedules);
  },

  async create(input: StaffScheduleInput): Promise<StaffSchedule> {
    const now = new Date().toISOString();

    const staffSchedule: StaffSchedule = {
      id: createId(),
      staffName: input.staffName,
      type: input.type,
      date: input.date,
      endDate: normalizeOptionalText(input.endDate),
      memo: input.memo ?? "",
      createdAt: now,
      updatedAt: now,
    };

    staffSchedules.push(staffSchedule);

    return staffSchedule;
  },

  async update(
    id: string,
    input: StaffScheduleUpdateInput,
  ): Promise<StaffSchedule | null> {
    const index = staffSchedules.findIndex((schedule) => schedule.id === id);

    if (index === -1) {
      return null;
    }

    const current = staffSchedules[index];

    const updated: StaffSchedule = {
      ...current,
      staffName: input.staffName ?? current.staffName,
      type: input.type ?? current.type,
      date: input.date ?? current.date,
      endDate:
        typeof input.endDate === "string"
          ? normalizeOptionalText(input.endDate)
          : current.endDate,
      memo: typeof input.memo === "string" ? input.memo : current.memo,
      updatedAt: new Date().toISOString(),
    };

    staffSchedules[index] = updated;

    return updated;
  },

  async delete(id: string): Promise<boolean> {
    const index = staffSchedules.findIndex((schedule) => schedule.id === id);

    if (index === -1) {
      return false;
    }

    staffSchedules.splice(index, 1);

    return true;
  },
};