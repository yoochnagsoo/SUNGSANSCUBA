export type ReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED";

export type Reservation = {
  id: string;

  name: string;
  email: string;
  phone: string;
  program: string;

  reservationDate: string;
  date?: string;

  experienceTime?: string;

  people: number;
  message: string;

  status: ReservationStatus;
  adminMemo: string;

  createdAt: string;
  updatedAt: string;
};

export type ReservationInput = {
  name: string;
  email: string;
  phone: string;
  program: string;

  reservationDate?: string;
  date?: string;

  experienceTime?: string;

  people: number;
  message?: string;

  status?: ReservationStatus;
  adminMemo?: string;
};

export type ReservationUpdateInput = {
  name?: string;
  email?: string;
  phone?: string;
  program?: string;

  reservationDate?: string;
  date?: string;

  experienceTime?: string;

  people?: number;
  message?: string;

  status?: ReservationStatus;
  adminMemo?: string;
};

export type ReservationListOptions = {
  limit?: number;
  cursor?: string;
  keyword?: string;
  status?: ReservationStatus | "ALL";
};

export type ReservationListResult = {
  reservations: Reservation[];
  nextCursor?: string;
};

export type ReservationRepository = {
  create(input: ReservationInput): Promise<Reservation>;

  findAll(): Promise<Reservation[]>;

  findPaginated(
    options: ReservationListOptions,
  ): Promise<ReservationListResult>;

  findById(id: string): Promise<Reservation | null>;

  update(
    id: string,
    input: ReservationUpdateInput,
  ): Promise<Reservation | null>;

  delete(id: string): Promise<boolean>;
};