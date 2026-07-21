export type GroupDiveStatus =
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED";

export type GroupDiveBillingType =
  | "GROUP"
  | "INDIVIDUAL";

export type GroupDiveTripStatus =
  | "SCHEDULED"
  | "BOARDING"
  | "DEPARTED"
  | "COMPLETED"
  | "CANCELLED"
  | "WEATHER_CANCELLED";

export type GroupDiveSettlementStatus =
  | "UNPAID"
  | "PARTIAL"
  | "PAID";

export type GroupDivePaymentMethod =
  | "CASH"
  | "BANK_TRANSFER"
  | "CARD"
  | "OTHER";

export type GroupDivePaymentStatus =
  | "ACTIVE"
  | "CANCELLED";

export type GroupDiveParticipant = {
  id: string;
  groupDiveId: string;

  name: string;
  phone: string;
  certification: string;

  rentalItems: string[];
  nitroxDefault: boolean;

  memo: string;
  active: boolean;

  createdAt: string;
  updatedAt: string;
};

export type GroupDiveTripParticipant = {
  participantId: string;
  participantName: string;

  /*
   * 승선 여부가 곧 해당 회차의 이용 및 정산 대상 여부입니다.
   */
  boarded: boolean;

  nitrox: boolean;
  rentalItems: string[];

  unitPrice?: number;
  memo: string;
};

export type GroupDiveTrip = {
  id: string;
  groupDiveId: string;

  date: string;

  /*
   * 고객 또는 그룹이 회차 등록 시 요청한 희망 시간입니다.
   */
  preferredTime?: string;

  /*
   * 기존 데이터 및 다른 화면과의 호환을 위한 필드입니다.
   * 신규 저장 시 preferredTime과 같은 값으로 유지합니다.
   */
  startTime: string;

  /*
   * 보트 운항 스케줄에 배정된 실제 출항 시간입니다.
   * 미배정 상태에서는 빈 문자열입니다.
   */
  actualDepartureTime?: string;

  /*
   * 배정되지 않은 회차는 빈 문자열 또는 undefined입니다.
   * 기존 DynamoDB 데이터와의 호환을 위해 선택 필드로 둡니다.
   */
  boatScheduleId?: string;

  plannedPointName: string;
  actualPointName: string;

  boatName: string;
  guideName: string;

  capacity: number;
  boardedCount?: number;
  status: GroupDiveTripStatus;

  participants: GroupDiveTripParticipant[];

  memo: string;

  createdAt: string;
  updatedAt: string;
};

export type GroupDivePayment = {
  id: string;
  groupDiveId: string;

  amount: number;
  paymentMethod: GroupDivePaymentMethod;
  paidAt: string;

  processedById: string;
  processedByName: string;

  memo: string;
  status: GroupDivePaymentStatus;

  cancelledAt: string;
  cancelledById: string;
  cancelledByName: string;
  cancelReason: string;

  createdAt: string;
  updatedAt: string;
};

export type GroupDiveSettlement = {
  additionalItems: GroupDiveSettlementAdditionalItem[];
  additionalAmount: number;
  discountAmount: number;
  paidAmount: number;

  status: GroupDiveSettlementStatus;
  paymentMethod?: GroupDivePaymentMethod;

  settledAt: string;
  memo: string;

  updatedAt: string;
};

export type GroupDiveSettlementAdditionalItem = {
  id: string;
  date: string;
  title: string;
  amount: number;
};

export type GroupDive = {
  id: string;

  groupName: string;

  representativeName: string;
  representativePhone: string;

  startDate: string;
  endDate: string;

  expectedPeople: number;

  billingType: GroupDiveBillingType;
  defaultDiveUnitPrice?: number;

  status: GroupDiveStatus;
  memo: string;

  participants: GroupDiveParticipant[];
  trips: GroupDiveTrip[];

  settlement: GroupDiveSettlement;
  payments: GroupDivePayment[];

  createdAt: string;
  updatedAt: string;
};

export type GroupDiveInput = {
  groupName: string;

  representativeName: string;
  representativePhone?: string;

  startDate: string;
  endDate: string;

  expectedPeople?: number;

  billingType?: GroupDiveBillingType;
  defaultDiveUnitPrice?: number;

  status?: GroupDiveStatus;
  memo?: string;
};

export type GroupDiveUpdateInput = {
  groupName?: string;

  representativeName?: string;
  representativePhone?: string;

  startDate?: string;
  endDate?: string;

  expectedPeople?: number;

  billingType?: GroupDiveBillingType;
  defaultDiveUnitPrice?: number;

  status?: GroupDiveStatus;
  memo?: string;

  participants?: GroupDiveParticipant[];
  trips?: GroupDiveTrip[];

  settlement?: GroupDiveSettlement;
  payments?: GroupDivePayment[];
};

export type GroupDiveParticipantInput = {
  name: string;
  phone?: string;
  certification?: string;

  rentalItems?: string[];
  nitroxDefault?: boolean;

  memo?: string;
  active?: boolean;
};

export type GroupDiveParticipantUpdateInput = {
  name?: string;
  phone?: string;
  certification?: string;

  rentalItems?: string[];
  nitroxDefault?: boolean;

  memo?: string;
  active?: boolean;
};

export type GroupDiveTripInput = {
  date: string;
  preferredTime: string;

  /* 기존 호출부 호환용 */
  startTime?: string;
  actualDepartureTime?: string;

  boatScheduleId?: string;

  plannedPointName: string;
  actualPointName?: string;

  boatName?: string;
  guideName?: string;

  capacity?: number;
  boardedCount?: number;
  status?: GroupDiveTripStatus;

  participantIds?: string[];

  memo?: string;
};

export type GroupDiveTripUpdateInput = {
  date?: string;
  preferredTime?: string;

  /* 기존 호출부 호환용 */
  startTime?: string;
  actualDepartureTime?: string;

  boatScheduleId?: string;

  plannedPointName?: string;
  actualPointName?: string;

  boatName?: string;
  guideName?: string;

  capacity?: number;
  boardedCount?: number;
  status?: GroupDiveTripStatus;

  participants?: GroupDiveTripParticipant[];

  memo?: string;
};

export type GroupDiveSettlementUpdateInput = {
  additionalItems?: GroupDiveSettlementAdditionalItem[];
  additionalAmount?: number;
  discountAmount?: number;

  paidAmount?: number;

  status?: GroupDiveSettlementStatus;
  paymentMethod?: GroupDivePaymentMethod;

  settledAt?: string;
  memo?: string;
};

export type GroupDivePaymentInput = {
  amount: number;
  paymentMethod: GroupDivePaymentMethod;

  paidAt?: string;

  processedById?: string;
  processedByName?: string;

  memo?: string;
};

export type GroupDivePaymentCancelInput = {
  cancelledById?: string;
  cancelledByName?: string;
  cancelReason: string;
};

export type GroupDiveRepository = {
  create(input: GroupDiveInput): Promise<GroupDive>;

  findAll(): Promise<GroupDive[]>;

  findById(id: string): Promise<GroupDive | null>;

  update(
    id: string,
    input: GroupDiveUpdateInput,
  ): Promise<GroupDive | null>;

  delete(id: string): Promise<boolean>;
};
