import { dynamoBoatScheduleRepository } from "./dynamoBoatScheduleRepository";
import { memoryBoatScheduleRepository } from "./memoryBoatScheduleRepository";

const useDynamoDb =
  process.env.BOAT_SCHEDULE_REPOSITORY === "dynamodb" ||
  process.env.NODE_ENV === "production";

export const boatScheduleRepository = useDynamoDb
  ? dynamoBoatScheduleRepository
  : memoryBoatScheduleRepository;

export function getBoatScheduleRepository() {
  return boatScheduleRepository;
}

export type {
  BoatSchedule,
  BoatScheduleInput,
  BoatScheduleRepository,
  BoatScheduleStatus,
  BoatScheduleUpdateInput,
} from "./types";
