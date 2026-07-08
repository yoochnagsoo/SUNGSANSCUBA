import { dynamoStaffScheduleRepository } from "./dynamoStaffScheduleRepository";
import { memoryStaffScheduleRepository } from "./memoryStaffScheduleRepository";
import type { StaffScheduleRepository } from "./types";

const useDynamoDb = Boolean(process.env.DYNAMODB_STAFF_SCHEDULES_TABLE);

export const staffScheduleRepository: StaffScheduleRepository = useDynamoDb
  ? dynamoStaffScheduleRepository
  : memoryStaffScheduleRepository;