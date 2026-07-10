export type StaffScheduleType =
  | "VACATION"
  | "HALF_DAY_AM"
  | "HALF_DAY_PM"
  | "SICK_LEAVE"
  | "UNAVAILABLE"
  | "TRAINING"
  | "BUSINESS_TRIP";

export type StaffSchedule = {
  id: string;
  staffName: string;
  type: StaffScheduleType;
  date: string;
  endDate?: string;
  memo?: string;
  createdAt: string;
  updatedAt: string;
};

export type StaffScheduleInput = {
  staffName: string;
  type: StaffScheduleType;
  date: string;
  endDate?: string;
  memo?: string;
};

export type StaffScheduleUpdateInput = {
  staffName?: string;
  type?: StaffScheduleType;
  date?: string;
  endDate?: string;
  memo?: string;
};

export type StaffScheduleRepository = {
  list: () => Promise<StaffSchedule[]>;
  create: (input: StaffScheduleInput) => Promise<StaffSchedule>;
  update: (
    id: string,
    input: StaffScheduleUpdateInput,
  ) => Promise<StaffSchedule | null>;
  delete: (id: string) => Promise<boolean>;
};