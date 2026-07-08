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
  memo: string;
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
  create(input: StaffScheduleInput): Promise<StaffSchedule>;

  findAll(): Promise<StaffSchedule[]>;

  findById(id: string): Promise<StaffSchedule | null>;

  update(
    id: string,
    input: StaffScheduleUpdateInput,
  ): Promise<StaffSchedule | null>;

  delete(id: string): Promise<boolean>;
};