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
  startTime: string;

  plannedPointName: string;
  actualPointName: string;

  boatName: string;
  guideName: string;

  capacity: number;
  status: GroupDiveTripStatus;

  participants: GroupDiveTripParticipant[];

  memo: string;

  createdAt: string;
  updatedAt: string;
};

export type GroupDivePayment = {
  id: string;
  groupDiveId: string;

  /*
   * 실제 수납한 금액입니다.
   */
  amount: number;

  paymentMethod: GroupDivePaymentMethod;

  /*
   * 실제 결제일입니다.
   * 관리자가 과거 결제를 등록할 수 있도록 별도 필드로 둡니다.
   */
  paidAt: string;

  /*
   * 결제를 등록한 관리자 정보입니다.
   * 관리자 계정 식별 정보가 없으면 이름만 저장할 수 있습니다.
   */
  processedById: string;
  processedByName: string;

  memo: string;

  /*
   * 결제 취소 시 데이터는 삭제하지 않고 상태만 변경합니다.
   */
  status: GroupDivePaymentStatus;

  cancelledAt: string;
  cancelledById: string;
  cancelledByName: string;
  cancelReason: string;

  createdAt: string;
  updatedAt: string;
};

export type GroupDiveSettlement = {
  /*
   * 기본 다이빙 금액 외 추가로 받을 금액입니다.
   * 장비 대여, 나이트록스, 보트 추가비 등을 합산해 입력합니다.
   */
  additionalAmount: number;

  /*
   * 전체 정산 금액에서 차감할 할인 금액입니다.
   */
  discountAmount: number;

  /*
   * 결제 이력 도입 이후에는 활성 결제 이력 합계로 계산합니다.
   * 기존 데이터 호환을 위해 필드는 유지합니다.
   */
  paidAmount: number;

  status: GroupDiveSettlementStatus;

  /*
   * 기존 단일 결제 방식 호환용입니다.
   * 여러 결제 방식이 섞일 수 있으므로 결제 이력 도입 후에는
   * 각 payment의 paymentMethod를 우선 사용합니다.
   */
  paymentMethod?: GroupDivePaymentMethod;

  settledAt: string;
  memo: string;

  updatedAt: string;
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

  /*
   * 결제 등록 및 취소 이력입니다.
   */
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
  startTime: string;

  plannedPointName: string;
  actualPointName?: string;

  boatName?: string;
  guideName?: string;

  capacity?: number;
  status?: GroupDiveTripStatus;

  participantIds?: string[];

  memo?: string;
};

export type GroupDiveTripUpdateInput = {
  date?: string;
  startTime?: string;

  plannedPointName?: string;
  actualPointName?: string;

  boatName?: string;
  guideName?: string;

  capacity?: number;
  status?: GroupDiveTripStatus;

  participants?: GroupDiveTripParticipant[];

  memo?: string;
};

export type GroupDiveSettlementUpdateInput = {
  additionalAmount?: number;
  discountAmount?: number;

  /*
   * 기존 정산 API 호환을 위해 유지합니다.
   * 결제 이력 API가 적용된 후에는 payments 합계로 자동 계산합니다.
   */
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