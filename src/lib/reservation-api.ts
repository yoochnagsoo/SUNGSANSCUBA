import { Reservation, ReservationStatus } from "@/types/reservation";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api";

export async function createReservation(data: {
  name: string;
  phone: string;
  email: string;
  program: string;
  date: string;
  people: string;
  message: string;
}) {
  const response = await fetch(`${API_BASE_URL}/reservations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to create reservation");
  }

  return response.json();
}

export async function getReservations(): Promise<Reservation[]> {
  const response = await fetch(`${API_BASE_URL}/reservations`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Failed to load reservations");
  }

  const data = await response.json();

  return data.reservations || [];
}

export async function updateReservation(
  id: string,
  data: Partial<{
    status: ReservationStatus;
    adminMemo: string;
  }>
): Promise<Reservation> {
  const response = await fetch(`${API_BASE_URL}/reservations/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Failed to update reservation");
  }

  const result = await response.json();

  return result.reservation;
}

export async function deleteReservation(id: string) {
  const response = await fetch(`${API_BASE_URL}/reservations/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete reservation");
  }

  return response.json();
}