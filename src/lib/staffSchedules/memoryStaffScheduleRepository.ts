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
  async create(input: StaffScheduleInput): Promise<StaffSchedule> {
    const now = new Date().toISOString();

    const staffSchedule: StaffSchedule = {
      id: createId(),
      staffName: input.staffName,
      type: input.type,
      date: input.date,
      endDate: input.endDate || undefined,
      memo: input.memo ?? "",
      createdAt: now,
      updatedAt: now,
    };

    staffSchedules.unshift(staffSchedule);

    return staffSchedule;
  },

  async findAll(): Promise<StaffSchedule[]> {
    return sortStaffSchedules(staffSchedules);
  },

  async findById(id: string): Promise<StaffSchedule | null> {
    return staffSchedules.find((schedule) => schedule.id === id) ?? null;
  },

  async update(
    id: string,
    input: StaffScheduleUpdateInput,
  ): Promise<StaffSchedule | null> {
    const index = staffSchedules.findIndex((schedule) => schedule.id === id);

    if (index === -1) {
      return null;
    }

    const updated: StaffSchedule = {
      ...staffSchedules[index],
      ...input,
      endDate: input.endDate || undefined,
      memo: input.memo ?? staffSchedules[index].memo,
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