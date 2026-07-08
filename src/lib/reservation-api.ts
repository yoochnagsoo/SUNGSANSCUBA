export type CreateReservationRequest = {
  name: string;
  email: string;
  phone: string;
  program: string;
  reservationDate: string;
  people: number;
  message?: string;
};

export async function createReservation(input: CreateReservationRequest) {
  const response = await fetch("/api/reservations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: input.name,
      email: input.email,
      phone: input.phone,
      program: input.program,

      reservationDate: input.reservationDate,
      date: input.reservationDate,

      people: input.people,
      message: input.message ?? "",
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    console.error("[createReservation] failed:", data);
    throw new Error(data?.message ?? "Failed to create reservation");
  }

  return data;
}