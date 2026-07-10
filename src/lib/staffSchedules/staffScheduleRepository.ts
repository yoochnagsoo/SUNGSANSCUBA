import { dynamoStaffScheduleRepository } from "./dynamoStaffScheduleRepository";
import type { StaffScheduleRepository } from "./types";

export const staffScheduleRepository: StaffScheduleRepository =
  dynamoStaffScheduleRepository;