import type {
  Reservation,
  ReservationInput,
  ReservationRepository,
} from "./types";

import { memoryReservationRepository } from "./memoryReservationRepository";
import { DynamoReservationRepository } from "./dynamoReservationRepository";

let repository: ReservationRepository | null = null;

export function getReservationRepository(): ReservationRepository {
  if (repository) {
    return repository;
  }

  const driver = process.env.RESERVATION_REPOSITORY || "memory";

  if (driver === "dynamodb") {
    repository = new DynamoReservationRepository();
  } else {
    repository = memoryReservationRepository;
  }

  return repository;
}

export async function listReservations(): Promise<Reservation[]> {
  return getReservationRepository().listReservations();
}

export async function getReservationById(
  id: string
): Promise<Reservation | null> {
  return getReservationRepository().getReservationById(id);
}

export async function createReservation(
  input: ReservationInput
): Promise<Reservation> {
  return getReservationRepository().createReservation(input);
}

export async function updateReservation(
  id: string,
  patch: Partial<Reservation>
): Promise<Reservation | null> {
  return getReservationRepository().updateReservation(id, patch);
}