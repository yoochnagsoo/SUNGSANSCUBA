export type BoatScheduleStatus =
  | "SCHEDULED"
  | "BOARDING"
  | "DEPARTED"
  | "COMPLETED"
  | "CANCELLED"
  | "WEATHER_CANCELLED";

export type BoatSchedule = {
  id: string;

  date: string;
  departureTime: string;

  boatName: string;
  plannedPointName: string;
  actualPointName: string;

  /*
   * 선장 1명을 제외한 실제 고객 승선 정원입니다.
   * SEONG SAN SCUBA 보트는 기본 11명입니다.
   */
  passengerCapacity: number;

  status: BoatScheduleStatus;
  memo: string;

  createdAt: string;
  updatedAt: string;
};

export type BoatScheduleInput = {
  date: string;
  departureTime: string;

  boatName?: string;
  plannedPointName?: string;
  actualPointName?: string;

  passengerCapacity?: number;

  status?: BoatScheduleStatus;
  memo?: string;
};

export type BoatScheduleUpdateInput = {
  date?: string;
  departureTime?: string;

  boatName?: string;
  plannedPointName?: string;
  actualPointName?: string;

  passengerCapacity?: number;

  status?: BoatScheduleStatus;
  memo?: string;
};

export type BoatScheduleRepository = {
  create(input: BoatScheduleInput): Promise<BoatSchedule>;

  findAll(): Promise<BoatSchedule[]>;

  findById(id: string): Promise<BoatSchedule | null>;

  update(
    id: string,
    input: BoatScheduleUpdateInput,
  ): Promise<BoatSchedule | null>;

  delete(id: string): Promise<boolean>;
};
