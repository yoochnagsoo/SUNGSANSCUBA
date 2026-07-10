export type ReservationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED";

export type ReservationSource = "CUSTOMER" | "ADMIN";

export type PaymentMethod =
  | "CASH"
  | "CARD"
  | "TRANSFER"
  | "NAVER_PAY"
  | "KAKAO_PAY"
  | "ETC";

export type Reservation = {
  id: string;

  source: ReservationSource;

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

  primaryStaffId?: string;
  primaryStaffName?: string;
  assistantStaffIds?: string[];
  assistantStaffNames?: string[];

  paymentAmount?: number;
  paymentMethod?: PaymentMethod;
  paymentMemo?: string;
  completedAt?: string;

  createdAt: string;
  updatedAt: string;
};

export type ReservationInput = {
  source?: ReservationSource;

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

  primaryStaffId?: string;
  primaryStaffName?: string;
  assistantStaffIds?: string[];
  assistantStaffNames?: string[];

  paymentAmount?: number;
  paymentMethod?: PaymentMethod;
  paymentMemo?: string;
  completedAt?: string;
};

export type ReservationUpdateInput = {
  source?: ReservationSource;

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

  primaryStaffId?: string;
  primaryStaffName?: string;
  assistantStaffIds?: string[];
  assistantStaffNames?: string[];

  paymentAmount?: number;
  paymentMethod?: PaymentMethod;
  paymentMemo?: string;
  completedAt?: string;
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