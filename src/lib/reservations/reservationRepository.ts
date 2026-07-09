import { memoryReservationRepository } from "./memoryReservationRepository";
import { dynamoReservationRepository } from "./dynamoReservationRepository";

const useDynamoDb =
  process.env.RESERVATION_REPOSITORY === "dynamodb" ||
  process.env.NODE_ENV === "production";

export const reservationRepository = useDynamoDb
  ? dynamoReservationRepository
  : memoryReservationRepository;

export function getReservationRepository() {
  return reservationRepository;
}

export type {
  Reservation,
  ReservationInput,
  ReservationSource,
  ReservationStatus,
  ReservationUpdateInput,
} from "./types";