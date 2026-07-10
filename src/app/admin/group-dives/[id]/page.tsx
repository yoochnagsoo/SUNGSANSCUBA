"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ChevronRight,
  Loader2,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Ship,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  GroupDive,
  GroupDiveBillingType,
  GroupDiveParticipant,
  GroupDivePayment,
  GroupDivePaymentMethod,
  GroupDiveSettlementStatus,
  GroupDiveStatus,
  GroupDiveTrip,
  GroupDiveTripParticipant,
  GroupDiveTripStatus,
} from "@/lib/groupDives/types";
import {
  formatPhoneInput,
  isValidKoreanMobilePhone,
} from "@/lib/phone";

type GroupDiveResponse = {
  ok: boolean;
  groupDive?: GroupDive;
  message?: string;
};

type ParticipantResponse = {
  ok: boolean;
  participant?: GroupDiveParticipant;
  participants?: GroupDiveParticipant[];
  message?: string;
};

type TripResponse = {
  ok: boolean;
  trip?: GroupDiveTrip;
  trips?: GroupDiveTrip[];
  message?: string;
};

type SettlementSummary = {
  baseAmount: number;
  additionalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
};

type SettlementResponse = {
  ok: boolean;
  settlement?: GroupDive["settlement"];
  summary?: SettlementSummary;
  message?: string;
};

type PaymentResponse = {
  ok: boolean;
  payment?: GroupDivePayment;
  payments?: GroupDivePayment[];
  settlement?: GroupDive["settlement"];
  summary?: SettlementSummary & {
    overpaidAmount?: number;
  };
  message?: string;
};

type PaymentFormState = {
  amount: string;
  paymentMethod: GroupDivePaymentMethod;
  paidAt: string;
  processedByName: string;
  memo: string;
};

type SettlementFormState = {
  additionalAmount: string;
  discountAmount: string;
  paidAmount: string;
  paymentMethod: "" | GroupDivePaymentMethod;
  status: GroupDiveSettlementStatus;
  memo: string;
};

type GroupFormState = {
  groupName: string;
  representativeName: string;
  representativePhone: string;
  startDate: string;
  endDate: string;
  expectedPeople: string;
  billingType: GroupDiveBillingType;
  defaultDiveUnitPrice: string;
  status: GroupDiveStatus;
  memo: string;
};

type ParticipantFormState = {
  name: string;
  phone: string;
  certification: string;
  rentalItemsText: string;
  nitroxDefault: boolean;
  memo: string;
};

type TripFormState = {
  date: string;
  startTime: string;
  plannedPointName: string;
  actualPointName: string;
  boatName: string;
  guideName: string;
  capacity: string;
  status: GroupDiveTripStatus;
  memo: string;
};

const initialParticipantForm: ParticipantFormState = {
  name: "",
  phone: "",
  certification: "",
  rentalItemsText: "",
  nitroxDefault: false,
  memo: "",
};

const initialTripForm: TripFormState = {
  date: "",
  startTime: "09:00",
  plannedPointName: "",
  actualPointName: "",
  boatName: "",
  guideName: "",
  capacity: "",
  status: "SCHEDULED",
  memo: "",
};

const groupStatusLabels: Record<GroupDiveStatus, string> = {
  ACTIVE: "진행 중",
  COMPLETED: "완료",
  CANCELLED: "취소",
};

const tripStatusLabels: Record<GroupDiveTripStatus, string> = {
  SCHEDULED: "예정",
  BOARDING: "승선 중",
  DEPARTED: "출항",
  COMPLETED: "완료",
  CANCELLED: "취소",
  WEATHER_CANCELLED: "기상 취소",
};

const tripStatusClasses: Record<GroupDiveTripStatus, string> = {
  SCHEDULED:
    "border-slate-200 bg-slate-50 text-slate-700",
  BOARDING:
    "border-amber-200 bg-amber-50 text-amber-700",
  DEPARTED:
    "border-blue-200 bg-blue-50 text-blue-700",
  COMPLETED:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  CANCELLED:
    "border-rose-200 bg-rose-50 text-rose-700",
  WEATHER_CANCELLED:
    "border-violet-200 bg-violet-50 text-violet-700",
};

const settlementStatusLabels: Record<
  GroupDiveSettlementStatus,
  string
> = {
  UNPAID: "미정산",
  PARTIAL: "일부 정산",
  PAID: "정산 완료",
};

const settlementStatusClasses: Record<
  GroupDiveSettlementStatus,
  string
> = {
  UNPAID: "border-rose-200 bg-rose-50 text-rose-700",
  PARTIAL: "border-amber-200 bg-amber-50 text-amber-700",
  PAID: "border-emerald-200 bg-emerald-50 text-emerald-700",
};

const paymentMethodLabels: Record<
  GroupDivePaymentMethod,
  string
> = {
  CASH: "현금",
  BANK_TRANSFER: "계좌이체",
  CARD: "카드",
  OTHER: "기타",
};


function formatDate(value: string) {
  if (!value) {
    return "-";
  }

  const [year, month, day] = value.split("-");

  if (!year || !month || !day) {
    return value;
  }

  return `${year}.${month}.${day}`;
}

function formatCurrency(value?: number) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return "미설정";
  }

  return `${value.toLocaleString("ko-KR")}원`;
}

function formatDateTime(value: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("ko-KR");
}

function toDateTimeLocalValue(value?: string) {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);

  return localDate.toISOString().slice(0, 16);
}

function normalizeRentalItems(value: string) {
  return Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
}

function sortParticipants(
  participants: GroupDiveParticipant[],
) {
  return [...participants].sort((a, b) => {
    if (a.active !== b.active) {
      return a.active ? -1 : 1;
    }

    return a.createdAt.localeCompare(b.createdAt);
  });
}

function sortTrips(trips: GroupDiveTrip[]) {
  return [...trips].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }

    if (a.startTime !== b.startTime) {
      return a.startTime.localeCompare(b.startTime);
    }

    return a.createdAt.localeCompare(b.createdAt);
  });
}

export default function AdminGroupDiveDetailPage() {
  const params = useParams<{
    id: string;
  }>();

  const router = useRouter();
  const groupDiveId = params.id;

  const [groupDive, setGroupDive] =
    useState<GroupDive | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [groupFormOpen, setGroupFormOpen] = useState(false);

  const [groupForm, setGroupForm] =
    useState<GroupFormState | null>(null);

  const [groupSubmitting, setGroupSubmitting] =
    useState(false);

  const [groupMessage, setGroupMessage] =
    useState("");

  const [participantFormOpen, setParticipantFormOpen] =
    useState(false);

  const [participantForm, setParticipantForm] =
    useState<ParticipantFormState>(
      initialParticipantForm,
    );

  const [editingParticipantId, setEditingParticipantId] =
    useState<string | null>(null);

  const [participantSubmitting, setParticipantSubmitting] =
    useState(false);

  const [participantMessage, setParticipantMessage] =
    useState("");

  const [tripFormOpen, setTripFormOpen] = useState(false);

  const [editingTripId, setEditingTripId] =
    useState<string | null>(null);

  const [tripForm, setTripForm] =
    useState<TripFormState>(initialTripForm);

  const [tripSubmitting, setTripSubmitting] =
    useState(false);

  const [tripMessage, setTripMessage] = useState("");

  const [boardingTrip, setBoardingTrip] =
    useState<GroupDiveTrip | null>(null);

  const [boardingParticipants, setBoardingParticipants] =
    useState<GroupDiveTripParticipant[]>([]);

  const [boardingSubmitting, setBoardingSubmitting] =
    useState(false);

  const [boardingMessage, setBoardingMessage] =
    useState("");

  const [settlementFormOpen, setSettlementFormOpen] =
    useState(false);

  const [settlementSummary, setSettlementSummary] =
    useState<SettlementSummary | null>(null);

  const [settlementForm, setSettlementForm] =
    useState<SettlementFormState | null>(null);

  const [settlementLoading, setSettlementLoading] =
    useState(false);

  const [settlementSubmitting, setSettlementSubmitting] =
    useState(false);

  const [settlementMessage, setSettlementMessage] =
    useState("");

  const [payments, setPayments] =
    useState<GroupDivePayment[]>([]);

  const [paymentsLoading, setPaymentsLoading] =
    useState(false);

  const [paymentFormOpen, setPaymentFormOpen] =
    useState(false);

  const [paymentForm, setPaymentForm] =
    useState<PaymentFormState>({
      amount: "",
      paymentMethod: "BANK_TRANSFER",
      paidAt: toDateTimeLocalValue(),
      processedByName: "관리자",
      memo: "",
    });

  const [paymentSubmitting, setPaymentSubmitting] =
    useState(false);

  const [paymentMessage, setPaymentMessage] =
    useState("");

  const [cancellingPaymentId, setCancellingPaymentId] =
    useState("");

  const [groupFinalizing, setGroupFinalizing] =
    useState(false);

  const loadGroupDive = useCallback(
    async (showRefreshState = false) => {
      if (!groupDiveId) {
        return;
      }

      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrorMessage("");

      try {
        const response = await fetch(
          `/api/admin/group-dives/${groupDiveId}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const data =
          (await response.json()) as GroupDiveResponse;

        if (!response.ok || !data.ok || !data.groupDive) {
          throw new Error(
            data.message ??
              "그룹 다이빙 정보를 불러오지 못했습니다.",
          );
        }

        setGroupDive({
          ...data.groupDive,
          participants: sortParticipants(
            data.groupDive.participants,
          ),
          trips: sortTrips(data.groupDive.trips),
        });
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "그룹 다이빙 정보를 불러오지 못했습니다.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [groupDiveId],
  );

  const loadSettlement = useCallback(async () => {
    if (!groupDiveId) {
      return;
    }

    setSettlementLoading(true);
    setSettlementMessage("");

    try {
      const response = await fetch(
        `/api/admin/group-dives/${groupDiveId}/settlement`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const data =
        (await response.json()) as SettlementResponse;

      if (!response.ok || !data.ok || !data.summary) {
        throw new Error(
          data.message ??
            "정산 정보를 불러오지 못했습니다.",
        );
      }

      setSettlementSummary(data.summary);
    } catch (error) {
      setSettlementMessage(
        error instanceof Error
          ? error.message
          : "정산 정보를 불러오지 못했습니다.",
      );
    } finally {
      setSettlementLoading(false);
    }
  }, [groupDiveId]);

  const loadPayments = useCallback(async () => {
    if (!groupDiveId) {
      return;
    }

    setPaymentsLoading(true);
    setPaymentMessage("");

    try {
      const response = await fetch(
        `/api/admin/group-dives/${groupDiveId}/payments`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const data =
        (await response.json()) as PaymentResponse;

      if (!response.ok || !data.ok) {
        throw new Error(
          data.message ??
            "결제 내역을 불러오지 못했습니다.",
        );
      }

      setPayments(data.payments || []);

      if (data.summary) {
        setSettlementSummary(data.summary);
      }

      if (data.settlement) {
        setGroupDive((previous) =>
          previous
            ? {
                ...previous,
                settlement: data.settlement!,
                payments: data.payments || previous.payments,
              }
            : previous,
        );
      }
    } catch (error) {
      setPaymentMessage(
        error instanceof Error
          ? error.message
          : "결제 내역을 불러오지 못했습니다.",
      );
    } finally {
      setPaymentsLoading(false);
    }
  }, [groupDiveId]);

  useEffect(() => {
    void loadGroupDive();
    void loadSettlement();
    void loadPayments();
  }, [loadGroupDive, loadSettlement, loadPayments]);

  const summary = useMemo(() => {
    if (!groupDive) {
      return {
        activeParticipants: 0,
        tripCount: 0,
        boardedCount: 0,
        estimatedAmount: 0,
      };
    }

    const boardedCount = groupDive.trips.reduce(
      (total, trip) =>
        total +
        trip.participants.filter(
          (participant) => participant.boarded,
        ).length,
      0,
    );


    const estimatedAmount = groupDive.trips.reduce(
      (total, trip) =>
        total +
        trip.participants.reduce(
          (tripTotal, participant) => {
            if (!participant.boarded) {
              return tripTotal;
            }

            return (
              tripTotal +
              (participant.unitPrice ??
                groupDive.defaultDiveUnitPrice ??
                0)
            );
          },
          0,
        ),
      0,
    );

    return {
      activeParticipants:
        groupDive.participants.filter(
          (participant) => participant.active,
        ).length,
      tripCount: groupDive.trips.length,
      boardedCount,
      estimatedAmount,
    };
  }, [groupDive]);

  const isGroupLocked =
    groupDive?.status === "COMPLETED";

  function openGroupEditForm() {
    if (!groupDive) {
      return;
    }

    setGroupForm({
      groupName: groupDive.groupName,
      representativeName: groupDive.representativeName,
      representativePhone: groupDive.representativePhone,
      startDate: groupDive.startDate,
      endDate: groupDive.endDate,
      expectedPeople: String(groupDive.expectedPeople),
      billingType: groupDive.billingType,
      defaultDiveUnitPrice:
        typeof groupDive.defaultDiveUnitPrice === "number"
          ? String(groupDive.defaultDiveUnitPrice)
          : "",
      status: groupDive.status,
      memo: groupDive.memo,
    });

    setGroupMessage("");
    setGroupFormOpen(true);
  }

  function closeGroupEditForm() {
    if (groupSubmitting) {
      return;
    }

    setGroupFormOpen(false);
    setGroupForm(null);
    setGroupMessage("");
  }

  async function handleGroupSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!groupDive || !groupForm || groupSubmitting) {
      return;
    }

    setGroupMessage("");

    const groupName = groupForm.groupName.trim();
    const representativeName =
      groupForm.representativeName.trim();
    const representativePhone =
      groupForm.representativePhone.trim();

    if (!groupName) {
      setGroupMessage("팀명을 입력해주세요.");
      return;
    }

    if (!representativeName) {
      setGroupMessage("대표자 이름을 입력해주세요.");
      return;
    }

    if (
      !isValidKoreanMobilePhone(
        representativePhone,
      )
    ) {
      setGroupMessage(
        "대표자 연락처는 010으로 시작하는 휴대폰 번호를 입력해주세요.",
      );
      return;
    }

    if (!groupForm.startDate || !groupForm.endDate) {
      setGroupMessage(
        "이용 시작일과 종료일을 입력해주세요.",
      );
      return;
    }

    if (groupForm.endDate < groupForm.startDate) {
      setGroupMessage(
        "종료일은 시작일보다 빠를 수 없습니다.",
      );
      return;
    }

    const expectedPeople = Number(
      groupForm.expectedPeople,
    );

    if (
      !Number.isFinite(expectedPeople) ||
      expectedPeople < 1
    ) {
      setGroupMessage(
        "예상 인원은 1명 이상이어야 합니다.",
      );
      return;
    }

    const defaultDiveUnitPrice =
      groupForm.defaultDiveUnitPrice.trim()
        ? Number(groupForm.defaultDiveUnitPrice)
        : undefined;

    if (
      typeof defaultDiveUnitPrice !== "undefined" &&
      (!Number.isFinite(defaultDiveUnitPrice) ||
        defaultDiveUnitPrice < 0)
    ) {
      setGroupMessage(
        "기본 다이빙 단가를 올바르게 입력해주세요.",
      );
      return;
    }

    const outsideRangeTrip = groupDive.trips.find(
      (trip) =>
        trip.date < groupForm.startDate ||
        trip.date > groupForm.endDate,
    );

    if (outsideRangeTrip) {
      setGroupMessage(
        `${formatDate(outsideRangeTrip.date)} 회차가 변경할 이용 기간 밖에 있습니다.`,
      );
      return;
    }

    setGroupSubmitting(true);

    try {
      const response = await fetch(
        `/api/admin/group-dives/${groupDive.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            groupName,
            representativeName,
            representativePhone,
            startDate: groupForm.startDate,
            endDate: groupForm.endDate,
            expectedPeople,
            billingType: groupForm.billingType,
            defaultDiveUnitPrice,
            status: groupForm.status,
            memo: groupForm.memo.trim(),
          }),
        },
      );

      const data =
        (await response.json()) as GroupDiveResponse;

      if (!response.ok || !data.ok || !data.groupDive) {
        throw new Error(
          data.message ??
            "그룹 기본정보를 수정하지 못했습니다.",
        );
      }

      setGroupDive({
        ...data.groupDive,
        participants: sortParticipants(
          data.groupDive.participants,
        ),
        trips: sortTrips(data.groupDive.trips),
      });

      closeGroupEditForm();
    } catch (error) {
      setGroupMessage(
        error instanceof Error
          ? error.message
          : "그룹 기본정보를 수정하지 못했습니다.",
      );
    } finally {
      setGroupSubmitting(false);
    }
  }

  function openParticipantCreateForm() {
    setEditingParticipantId(null);
    setParticipantForm(initialParticipantForm);
    setParticipantMessage("");
    setParticipantFormOpen(true);
  }

  function openParticipantEditForm(
    participant: GroupDiveParticipant,
  ) {
    setEditingParticipantId(participant.id);

    setParticipantForm({
      name: participant.name,
      phone: participant.phone,
      certification: participant.certification,
      rentalItemsText:
        participant.rentalItems.join(", "),
      nitroxDefault: participant.nitroxDefault,
      memo: participant.memo,
    });

    setParticipantMessage("");
    setParticipantFormOpen(true);
  }

  function closeParticipantForm() {
    if (participantSubmitting) {
      return;
    }

    setParticipantFormOpen(false);
    setEditingParticipantId(null);
    setParticipantMessage("");
  }

  async function handleParticipantSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!groupDive || participantSubmitting) {
      return;
    }

    setParticipantMessage("");

    const name = participantForm.name.trim();
    const phone = participantForm.phone.trim();

    if (!name) {
      setParticipantMessage(
        "참가자 이름을 입력해주세요.",
      );
      return;
    }

    if (
      phone &&
      !isValidKoreanMobilePhone(phone)
    ) {
      setParticipantMessage(
        "참가자 연락처는 010으로 시작하는 휴대폰 번호를 입력해주세요.",
      );
      return;
    }

    setParticipantSubmitting(true);

    try {
      const url = editingParticipantId
        ? `/api/admin/group-dives/${groupDive.id}/participants/${editingParticipantId}`
        : `/api/admin/group-dives/${groupDive.id}/participants`;

      const response = await fetch(url, {
        method: editingParticipantId
          ? "PATCH"
          : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
          certification:
            participantForm.certification.trim(),
          rentalItems: normalizeRentalItems(
            participantForm.rentalItemsText,
          ),
          nitroxDefault:
            participantForm.nitroxDefault,
          memo: participantForm.memo.trim(),
          active: true,
        }),
      });

      const data =
        (await response.json()) as ParticipantResponse;

      if (!response.ok || !data.ok) {
        throw new Error(
          data.message ??
            "참가자 정보를 저장하지 못했습니다.",
        );
      }

      await loadGroupDive(true);
      closeParticipantForm();
    } catch (error) {
      setParticipantMessage(
        error instanceof Error
          ? error.message
          : "참가자 정보를 저장하지 못했습니다.",
      );
    } finally {
      setParticipantSubmitting(false);
    }
  }

  async function handleDeleteParticipant(
    participant: GroupDiveParticipant,
  ) {
    if (
      !groupDive ||
      !window.confirm(
        `${participant.name} 참가자를 삭제할까요?\n이미 등록된 회차에서도 제거됩니다.`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/group-dives/${groupDive.id}/participants/${participant.id}`,
        {
          method: "DELETE",
        },
      );

      const data =
        (await response.json()) as ParticipantResponse;

      if (!response.ok || !data.ok) {
        throw new Error(
          data.message ??
            "참가자를 삭제하지 못했습니다.",
        );
      }

      await loadGroupDive(true);
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "참가자를 삭제하지 못했습니다.",
      );
    }
  }

  function openTripCreateForm() {
    if (!groupDive) {
      return;
    }

    setEditingTripId(null);

    setTripForm({
      ...initialTripForm,
      date: groupDive.startDate,
      capacity: String(
        Math.max(
          groupDive.expectedPeople,
          summary.activeParticipants,
        ),
      ),
    });

    setTripMessage("");
    setTripFormOpen(true);
  }

  function openTripEditForm(trip: GroupDiveTrip) {
    setEditingTripId(trip.id);

    setTripForm({
      date: trip.date,
      startTime: trip.startTime,
      plannedPointName: trip.plannedPointName,
      actualPointName: trip.actualPointName,
      boatName: trip.boatName,
      guideName: trip.guideName,
      capacity:
        trip.capacity > 0
          ? String(trip.capacity)
          : "",
      status: trip.status,
      memo: trip.memo,
    });

    setTripMessage("");
    setTripFormOpen(true);
  }

  function closeTripForm() {
    if (tripSubmitting) {
      return;
    }

    setTripFormOpen(false);
    setEditingTripId(null);
    setTripMessage("");
  }

  async function handleTripSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!groupDive || tripSubmitting) {
      return;
    }

    setTripMessage("");

    if (!tripForm.date) {
      setTripMessage(
        "다이빙 날짜를 입력해주세요.",
      );
      return;
    }

    if (!tripForm.startTime) {
      setTripMessage(
        "출항 시간을 입력해주세요.",
      );
      return;
    }

    if (!tripForm.plannedPointName.trim()) {
      setTripMessage(
        "예정 다이빙 포인트를 입력해주세요.",
      );
      return;
    }

    const capacity = tripForm.capacity.trim()
      ? Number(tripForm.capacity)
      : 0;

    if (
      !Number.isFinite(capacity) ||
      capacity < 0
    ) {
      setTripMessage(
        "보트 정원을 올바르게 입력해주세요.",
      );
      return;
    }

    setTripSubmitting(true);

    try {
      const response = await fetch(
        editingTripId
          ? `/api/admin/group-dives/${groupDive.id}/trips/${editingTripId}`
          : `/api/admin/group-dives/${groupDive.id}/trips`,
        {
          method: editingTripId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            date: tripForm.date,
            startTime: tripForm.startTime,
            plannedPointName:
              tripForm.plannedPointName.trim(),
            actualPointName:
              tripForm.actualPointName.trim(),
            boatName: tripForm.boatName.trim(),
            guideName: tripForm.guideName.trim(),
            capacity,
            status: tripForm.status,
            ...(editingTripId
              ? {}
              : {
                  participantIds: [],
                }),
            memo: tripForm.memo.trim(),
          }),
        },
      );

      const data =
        (await response.json()) as TripResponse;

      if (!response.ok || !data.ok) {
        throw new Error(
          data.message ??
            editingTripId
              ? "다이빙 회차를 수정하지 못했습니다."
              : editingTripId
            ? "다이빙 회차를 수정하지 못했습니다."
            : "다이빙 회차를 등록하지 못했습니다.",
        );
      }

      await loadGroupDive(true);
      closeTripForm();
    } catch (error) {
      setTripMessage(
        error instanceof Error
          ? error.message
          : "다이빙 회차를 등록하지 못했습니다.",
      );
    } finally {
      setTripSubmitting(false);
    }
  }

  async function handleDeleteTrip(
    trip: GroupDiveTrip,
  ) {
    if (
      !groupDive ||
      !window.confirm(
        `${formatDate(trip.date)} ${trip.startTime} 회차를 삭제할까요?`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/group-dives/${groupDive.id}/trips/${trip.id}`,
        {
          method: "DELETE",
        },
      );

      const data =
        (await response.json()) as TripResponse;

      if (!response.ok || !data.ok) {
        throw new Error(
          data.message ??
            "다이빙 회차를 삭제하지 못했습니다.",
        );
      }

      await loadGroupDive(true);
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "다이빙 회차를 삭제하지 못했습니다.",
      );
    }
  }

  function openBoardingForm(trip: GroupDiveTrip) {
    if (!groupDive) {
      return;
    }

    const existingMap = new Map(
      trip.participants.map((participant) => [
        participant.participantId,
        participant,
      ]),
    );

    const participants =
      groupDive.participants
        .filter((participant) => participant.active)
        .map((participant) => {
          const existing = existingMap.get(
            participant.id,
          );

          if (existing) {
            return {
              ...existing,
              participantName: participant.name,
            };
          }

          return {
            participantId: participant.id,
            participantName: participant.name,
            boarded: false,
            nitrox: participant.nitroxDefault,
            rentalItems: [...participant.rentalItems],
            unitPrice:
              groupDive.defaultDiveUnitPrice,
            memo: "",
          };
        });

    setBoardingTrip(trip);
    setBoardingParticipants(participants);
    setBoardingMessage("");
  }

  function closeBoardingForm() {
    if (boardingSubmitting) {
      return;
    }

    setBoardingTrip(null);
    setBoardingParticipants([]);
    setBoardingMessage("");
  }

  function updateBoardingParticipant(
    participantId: string,
    patch: Partial<GroupDiveTripParticipant>,
  ) {
    setBoardingParticipants((previous) =>
      previous.map((participant) =>
        participant.participantId === participantId
          ? {
              ...participant,
              ...patch,
            }
          : participant,
      ),
    );
  }

  function selectAllBoarding() {
    setBoardingParticipants((previous) =>
      previous.map((participant) => ({
        ...participant,
        boarded: true,
      })),
    );
  }

  function clearAllBoarding() {
    setBoardingParticipants((previous) =>
      previous.map((participant) => ({
        ...participant,
        boarded: false,
      })),
    );
  }

  async function handleBoardingSubmit() {
    if (
      !groupDive ||
      !boardingTrip ||
      boardingSubmitting
    ) {
      return;
    }

    const boardedCount =
      boardingParticipants.filter(
        (participant) => participant.boarded,
      ).length;

    if (
      boardingTrip.capacity > 0 &&
      boardedCount > boardingTrip.capacity
    ) {
      setBoardingMessage(
        `승선 인원이 보트 정원 ${boardingTrip.capacity}명을 초과합니다.`,
      );
      return;
    }

    setBoardingSubmitting(true);
    setBoardingMessage("");

    try {
      const response = await fetch(
        `/api/admin/group-dives/${groupDive.id}/trips/${boardingTrip.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            participants: boardingParticipants,
          }),
        },
      );

      const data =
        (await response.json()) as TripResponse;

      if (!response.ok || !data.ok) {
        throw new Error(
          data.message ??
            "승선 명단을 저장하지 못했습니다.",
        );
      }

      await loadGroupDive(true);
      closeBoardingForm();
    } catch (error) {
      setBoardingMessage(
        error instanceof Error
          ? error.message
          : "승선 명단을 저장하지 못했습니다.",
      );
    } finally {
      setBoardingSubmitting(false);
    }
  }

  function openSettlementForm() {
    if (!groupDive) {
      return;
    }

    setSettlementForm({
      additionalAmount: String(
        groupDive.settlement.additionalAmount ?? 0,
      ),
      discountAmount: String(
        groupDive.settlement.discountAmount ?? 0,
      ),
      paidAmount: String(
        groupDive.settlement.paidAmount ?? 0,
      ),
      paymentMethod:
        groupDive.settlement.paymentMethod ?? "",
      status: groupDive.settlement.status,
      memo: groupDive.settlement.memo ?? "",
    });

    setSettlementMessage("");
    setSettlementFormOpen(true);
  }

  function closeSettlementForm() {
    if (settlementSubmitting) {
      return;
    }

    setSettlementFormOpen(false);
    setSettlementForm(null);
    setSettlementMessage("");
  }

  async function handleSettlementSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !groupDive ||
      !settlementForm ||
      settlementSubmitting
    ) {
      return;
    }

    const additionalAmount = Number(
      settlementForm.additionalAmount || 0,
    );
    const discountAmount = Number(
      settlementForm.discountAmount || 0,
    );
    const paidAmount = Number(
      settlementForm.paidAmount || 0,
    );

    if (
      !Number.isFinite(additionalAmount) ||
      additionalAmount < 0
    ) {
      setSettlementMessage(
        "추가 비용을 올바르게 입력해주세요.",
      );
      return;
    }

    if (
      !Number.isFinite(discountAmount) ||
      discountAmount < 0
    ) {
      setSettlementMessage(
        "할인 금액을 올바르게 입력해주세요.",
      );
      return;
    }

    if (
      !Number.isFinite(paidAmount) ||
      paidAmount < 0
    ) {
      setSettlementMessage(
        "결제 금액을 올바르게 입력해주세요.",
      );
      return;
    }

    setSettlementSubmitting(true);
    setSettlementMessage("");

    try {
      const response = await fetch(
        `/api/admin/group-dives/${groupDive.id}/settlement`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            additionalAmount,
            discountAmount,
            paidAmount,
            paymentMethod:
              settlementForm.paymentMethod || "",
            status: settlementForm.status,
            memo: settlementForm.memo.trim(),
          }),
        },
      );

      const data =
        (await response.json()) as SettlementResponse;

      if (
        !response.ok ||
        !data.ok ||
        !data.settlement ||
        !data.summary
      ) {
        throw new Error(
          data.message ??
            "정산 정보를 저장하지 못했습니다.",
        );
      }

      setGroupDive((previous) =>
        previous
          ? {
              ...previous,
              settlement: data.settlement!,
            }
          : previous,
      );

      setSettlementSummary(data.summary);
      closeSettlementForm();
    } catch (error) {
      setSettlementMessage(
        error instanceof Error
          ? error.message
          : "정산 정보를 저장하지 못했습니다.",
      );
    } finally {
      setSettlementSubmitting(false);
    }
  }

  function openPaymentForm() {
    setPaymentForm({
      amount: "",
      paymentMethod: "BANK_TRANSFER",
      paidAt: toDateTimeLocalValue(),
      processedByName: "관리자",
      memo: "",
    });

    setPaymentMessage("");
    setPaymentFormOpen(true);
  }

  function closePaymentForm() {
    if (paymentSubmitting) {
      return;
    }

    setPaymentFormOpen(false);
    setPaymentMessage("");
  }

  async function handlePaymentSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!groupDive || paymentSubmitting) {
      return;
    }

    const amount = Number(paymentForm.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      setPaymentMessage(
        "결제 금액은 0원보다 크게 입력해주세요.",
      );
      return;
    }

    if (!paymentForm.paidAt) {
      setPaymentMessage("결제 일시를 입력해주세요.");
      return;
    }

    setPaymentSubmitting(true);
    setPaymentMessage("");

    try {
      const response = await fetch(
        `/api/admin/group-dives/${groupDive.id}/payments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount,
            paymentMethod: paymentForm.paymentMethod,
            paidAt: paymentForm.paidAt,
            processedByName:
              paymentForm.processedByName.trim() ||
              "관리자",
            memo: paymentForm.memo.trim(),
          }),
        },
      );

      const data =
        (await response.json()) as PaymentResponse;

      if (
        !response.ok ||
        !data.ok ||
        !data.payments ||
        !data.settlement ||
        !data.summary
      ) {
        throw new Error(
          data.message ??
            "결제 내역을 등록하지 못했습니다.",
        );
      }

      setPayments(data.payments);
      setSettlementSummary(data.summary);
      setGroupDive((previous) =>
        previous
          ? {
              ...previous,
              payments: data.payments!,
              settlement: data.settlement!,
            }
          : previous,
      );

      closePaymentForm();
    } catch (error) {
      setPaymentMessage(
        error instanceof Error
          ? error.message
          : "결제 내역을 등록하지 못했습니다.",
      );
    } finally {
      setPaymentSubmitting(false);
    }
  }

  async function handleCancelPayment(
    payment: GroupDivePayment,
  ) {
    if (!groupDive || cancellingPaymentId) {
      return;
    }

    const reason = window.prompt(
      `${formatCurrency(payment.amount)} 결제를 취소하는 사유를 입력해주세요.`,
    );

    if (!reason?.trim()) {
      return;
    }

    setCancellingPaymentId(payment.id);

    try {
      const response = await fetch(
        `/api/admin/group-dives/${groupDive.id}/payments/${payment.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            cancelledByName: "관리자",
            cancelReason: reason.trim(),
          }),
        },
      );

      const data =
        (await response.json()) as PaymentResponse;

      if (
        !response.ok ||
        !data.ok ||
        !data.payments ||
        !data.settlement ||
        !data.summary
      ) {
        throw new Error(
          data.message ??
            "결제를 취소하지 못했습니다.",
        );
      }

      setPayments(data.payments);
      setSettlementSummary(data.summary);
      setGroupDive((previous) =>
        previous
          ? {
              ...previous,
              payments: data.payments!,
              settlement: data.settlement!,
            }
          : previous,
      );
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "결제를 취소하지 못했습니다.",
      );
    } finally {
      setCancellingPaymentId("");
    }
  }

  async function handleToggleGroupComplete() {
    if (!groupDive || groupFinalizing) {
      return;
    }

    const completing =
      groupDive.status !== "COMPLETED";

    const confirmed = window.confirm(
      completing
        ? "모든 회차와 정산을 확인하고 그룹 다이빙을 마감할까요?\n마감 후에는 참가자, 회차, 승선, 정산, 결제 수정이 잠깁니다."
        : "이 그룹 다이빙을 다시 진행 중 상태로 복구할까요?",
    );

    if (!confirmed) {
      return;
    }

    setGroupFinalizing(true);

    try {
      const response = await fetch(
        `/api/admin/group-dives/${groupDive.id}/complete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: completing ? "COMPLETE" : "REOPEN",
          }),
        },
      );

      const data =
        (await response.json()) as GroupDiveResponse;

      if (!response.ok || !data.ok || !data.groupDive) {
        throw new Error(
          data.message ??
            (completing
              ? "그룹 다이빙을 마감하지 못했습니다."
              : "그룹 다이빙을 복구하지 못했습니다."),
        );
      }

      setGroupDive({
        ...data.groupDive,
        participants: sortParticipants(
          data.groupDive.participants,
        ),
        trips: sortTrips(data.groupDive.trips),
      });

      await loadSettlement();
      await loadPayments();
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "그룹 상태를 변경하지 못했습니다.",
      );
    } finally {
      setGroupFinalizing(false);
    }
  }

  async function handleDeleteGroupDive() {
    if (
      !groupDive ||
      !window.confirm(
        `${groupDive.groupName} 그룹 다이빙을 삭제할까요?\n참가자와 모든 회차 정보가 함께 삭제됩니다.`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/group-dives/${groupDive.id}`,
        {
          method: "DELETE",
        },
      );

      const data =
        (await response.json()) as GroupDiveResponse;

      if (!response.ok || !data.ok) {
        throw new Error(
          data.message ??
            "그룹 다이빙을 삭제하지 못했습니다.",
        );
      }

      router.push("/admin/group-dives");
      router.refresh();
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "그룹 다이빙을 삭제하지 못했습니다.",
      );
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-cyan-600" />
          <p className="mt-3 text-sm font-semibold text-slate-500">
            그룹 다이빙 정보를 불러오는 중입니다.
          </p>
        </div>
      </div>
    );
  }

  if (!groupDive) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center">
          <p className="font-bold text-rose-700">
            {errorMessage ||
              "그룹 다이빙 정보를 찾을 수 없습니다."}
          </p>

          <Link
            href="/admin/group-dives"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-bold text-white"
          >
            목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <Link
            href="/admin/group-dives"
            className="inline-flex items-center gap-1 text-sm font-bold text-slate-500 transition hover:text-cyan-600"
          >
            <ArrowLeft className="h-4 w-4" />
            그룹 다이빙 목록
          </Link>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-black text-cyan-700">
              {groupDive.status === "ACTIVE"
                ? "진행 중"
                : groupDive.status === "COMPLETED"
                  ? "완료"
                  : "취소"}
            </span>

            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              {groupDive.billingType === "GROUP"
                ? "팀 일괄 정산"
                : "개인별 정산"}
            </span>
          </div>

          <h1 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            {groupDive.groupName}
          </h1>

          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <UserRound className="h-4 w-4" />
              {groupDive.representativeName}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <Phone className="h-4 w-4" />
              {groupDive.representativePhone}
            </span>

            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              {formatDate(groupDive.startDate)} ~{" "}
              {formatDate(groupDive.endDate)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              void handleToggleGroupComplete()
            }
            disabled={groupFinalizing}
            className={[
              "inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-60",
              groupDive.status === "COMPLETED"
                ? "bg-amber-600 hover:bg-amber-700"
                : "bg-emerald-600 hover:bg-emerald-700",
            ].join(" ")}
          >
            {groupFinalizing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {groupDive.status === "COMPLETED"
              ? "진행 중으로 복구"
              : "그룹 마감"}
          </button>

          <button
            type="button"
            onClick={openGroupEditForm}
            disabled={isGroupLocked}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Pencil className="h-4 w-4" />
            기본정보 수정
          </button>

          <button
            type="button"
            onClick={() => {
              void loadGroupDive(true);
              void loadSettlement();
              void loadPayments();
            }}
            disabled={refreshing}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              className={[
                "h-4 w-4",
                refreshing ? "animate-spin" : "",
              ].join(" ")}
            />
            새로고침
          </button>

          <button
            type="button"
            onClick={handleDeleteGroupDive}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 text-sm font-bold text-rose-600 hover:bg-rose-50"
          >
            <Trash2 className="h-4 w-4" />
            그룹 삭제
          </button>
        </div>
      </div>

      {isGroupLocked ? (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-800">
          마감된 그룹입니다. 참가자, 회차, 승선, 정산 및 결제 수정이 잠겨 있습니다.
          수정이 필요하면 상단의 “진행 중으로 복구”를 눌러주세요.
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold text-slate-500">
            예상 인원
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">
            {groupDive.expectedPeople}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold text-slate-500">
            등록 참가자
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">
            {summary.activeParticipants}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold text-slate-500">
            등록 회차
          </p>
          <p className="mt-2 text-2xl font-black text-slate-950">
            {summary.tripCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold text-slate-500">
            누적 승선
          </p>
          <p className="mt-2 text-2xl font-black text-cyan-600">
            {summary.boardedCount}
          </p>
        </div>

        <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-1">
          <p className="text-xs font-bold text-slate-500">
            예상 정산액
          </p>
          <p className="mt-2 text-xl font-black text-emerald-600">
            {formatCurrency(summary.estimatedAmount)}
          </p>
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-black text-slate-950">
                정산 현황
              </h2>

              <span
                className={[
                  "rounded-full border px-2.5 py-1 text-xs font-black",
                  settlementStatusClasses[
                    groupDive.settlement.status
                  ],
                ].join(" ")}
              >
                {
                  settlementStatusLabels[
                    groupDive.settlement.status
                  ]
                }
              </span>
            </div>

            <p className="mt-1 text-xs font-semibold text-slate-500">
              승선 인원과 참가자별 단가를 기준으로 계산합니다.
            </p>
          </div>

          <button
            type="button"
            onClick={openSettlementForm}
            disabled={isGroupLocked}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Pencil className="h-4 w-4" />
            정산 수정
          </button>
        </div>

        {settlementLoading ? (
          <div className="flex min-h-36 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
          </div>
        ) : settlementSummary ? (
          <>
            <div className="grid grid-cols-2 gap-px bg-slate-200 sm:grid-cols-3 lg:grid-cols-6">
              <div className="bg-white p-4">
                <p className="text-xs font-bold text-slate-500">
                  기본 이용금액
                </p>
                <p className="mt-2 text-lg font-black text-slate-950">
                  {formatCurrency(
                    settlementSummary.baseAmount,
                  )}
                </p>
              </div>

              <div className="bg-white p-4">
                <p className="text-xs font-bold text-slate-500">
                  추가 비용
                </p>
                <p className="mt-2 text-lg font-black text-amber-600">
                  +{" "}
                  {formatCurrency(
                    settlementSummary.additionalAmount,
                  )}
                </p>
              </div>

              <div className="bg-white p-4">
                <p className="text-xs font-bold text-slate-500">
                  할인
                </p>
                <p className="mt-2 text-lg font-black text-blue-600">
                  -{" "}
                  {formatCurrency(
                    settlementSummary.discountAmount,
                  )}
                </p>
              </div>

              <div className="bg-white p-4">
                <p className="text-xs font-bold text-slate-500">
                  최종 정산금액
                </p>
                <p className="mt-2 text-lg font-black text-slate-950">
                  {formatCurrency(
                    settlementSummary.finalAmount,
                  )}
                </p>
              </div>

              <div className="bg-white p-4">
                <p className="text-xs font-bold text-slate-500">
                  결제 금액
                </p>
                <p className="mt-2 text-lg font-black text-emerald-600">
                  {formatCurrency(
                    settlementSummary.paidAmount,
                  )}
                </p>
              </div>

              <div className="bg-white p-4">
                <p className="text-xs font-bold text-slate-500">
                  미수금
                </p>
                <p
                  className={[
                    "mt-2 text-lg font-black",
                    settlementSummary.unpaidAmount > 0
                      ? "text-rose-600"
                      : "text-emerald-600",
                  ].join(" ")}
                >
                  {formatCurrency(
                    settlementSummary.unpaidAmount,
                  )}
                </p>
              </div>
            </div>

            <div className="grid gap-4 border-t border-slate-200 bg-slate-50 px-5 py-4 text-sm sm:grid-cols-3 sm:px-6">
              <div>
                <p className="text-xs font-bold text-slate-400">
                  결제 방식
                </p>
                <p className="mt-1 font-bold text-slate-700">
                  {groupDive.settlement.paymentMethod
                    ? paymentMethodLabels[
                        groupDive.settlement.paymentMethod
                      ]
                    : "미설정"}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400">
                  정산 완료일
                </p>
                <p className="mt-1 font-bold text-slate-700">
                  {formatDateTime(
                    groupDive.settlement.settledAt,
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-400">
                  정산 메모
                </p>
                <p className="mt-1 whitespace-pre-wrap font-semibold text-slate-600">
                  {groupDive.settlement.memo || "-"}
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="px-5 py-6 text-sm font-semibold text-rose-600">
            {settlementMessage ||
              "정산 정보를 불러오지 못했습니다."}
          </div>
        )}
      </section>

      <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-lg font-black text-slate-950">
              결제 내역
            </h2>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              결제 등록과 취소 이력을 확인합니다.
            </p>
          </div>

          <button
            type="button"
            onClick={openPaymentForm}
            disabled={isGroupLocked}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
            결제 등록
          </button>
        </div>

        {paymentsLoading ? (
          <div className="flex min-h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : paymentMessage && payments.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm font-semibold text-rose-600">
            {paymentMessage}
          </div>
        ) : payments.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm font-semibold text-slate-500">
            등록된 결제 내역이 없습니다.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className={[
                  "px-5 py-4 sm:px-6",
                  payment.status === "CANCELLED"
                    ? "bg-slate-50 opacity-70"
                    : "bg-white",
                ].join(" ")}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className={[
                          "text-lg font-black",
                          payment.status === "CANCELLED"
                            ? "text-slate-500 line-through"
                            : "text-slate-950",
                        ].join(" ")}
                      >
                        {formatCurrency(payment.amount)}
                      </p>

                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-black text-blue-700">
                        {
                          paymentMethodLabels[
                            payment.paymentMethod
                          ]
                        }
                      </span>

                      {payment.status === "CANCELLED" ? (
                        <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-black text-rose-700">
                          결제 취소
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-black text-emerald-700">
                          정상 결제
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
                      <span>
                        결제일: {formatDateTime(payment.paidAt)}
                      </span>
                      <span>
                        처리자: {payment.processedByName || "관리자"}
                      </span>
                    </div>

                    {payment.memo ? (
                      <p className="mt-2 text-sm text-slate-600">
                        {payment.memo}
                      </p>
                    ) : null}

                    {payment.status === "CANCELLED" ? (
                      <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                        취소일: {formatDateTime(payment.cancelledAt)}
                        {" · "}
                        취소자: {payment.cancelledByName || "관리자"}
                        <br />
                        사유: {payment.cancelReason || "-"}
                      </div>
                    ) : null}
                  </div>

                  {payment.status === "ACTIVE" ? (
                    <button
                      type="button"
                      onClick={() =>
                        void handleCancelPayment(payment)
                      }
                      disabled={
                        cancellingPaymentId === payment.id
                      }
                      className="inline-flex h-9 shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-white px-3 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                    >
                      {cancellingPaymentId === payment.id
                        ? "취소 중..."
                        : "결제 취소"}
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-6 grid gap-6 2xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-lg font-black text-slate-950">
                참가자 명단
              </h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                이번 일정에 참여하는 실제 인원만 등록합니다.
              </p>
            </div>

            <button
              type="button"
              onClick={openParticipantCreateForm}
              disabled={isGroupLocked}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              참가자
            </button>
          </div>

          {groupDive.participants.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <Users className="h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-bold text-slate-700">
                등록된 참가자가 없습니다.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {groupDive.participants.map(
                (participant) => (
                  <div
                    key={participant.id}
                    className="flex items-start gap-4 px-5 py-4 sm:px-6"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600">
                      <UserRound className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-black text-slate-950">
                          {participant.name}
                        </p>

                        {participant.certification ? (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                            {participant.certification}
                          </span>
                        ) : null}

                        {participant.nitroxDefault ? (
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                            나이트록스
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {participant.phone || "연락처 없음"}
                      </p>

                      {participant.rentalItems.length > 0 ? (
                        <p className="mt-1 text-xs font-semibold text-amber-600">
                          대여:{" "}
                          {participant.rentalItems.join(", ")}
                        </p>
                      ) : null}

                      {participant.memo ? (
                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          {participant.memo}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        disabled={isGroupLocked}
                        onClick={() =>
                          openParticipantEditForm(
                            participant,
                          )
                        }
                        aria-label="참가자 수정"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        disabled={isGroupLocked}
                        onClick={() =>
                          void handleDeleteParticipant(
                            participant,
                          )
                        }
                        aria-label="참가자 삭제"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-rose-500 hover:bg-rose-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-lg font-black text-slate-950">
                다이빙 회차
              </h2>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                포인트별 승선 인원과 정산 대상을 관리합니다.
              </p>
            </div>

            <button
              type="button"
              onClick={openTripCreateForm}
              disabled={isGroupLocked}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              회차
            </button>
          </div>

          {groupDive.trips.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
              <Ship className="h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-bold text-slate-700">
                등록된 다이빙 회차가 없습니다.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {groupDive.trips.map((trip) => {
                const boardedCount =
                  trip.participants.filter(
                    (participant) =>
                      participant.boarded,
                  ).length;


                return (
                  <div
                    key={trip.id}
                    className="px-5 py-5 sm:px-6"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={[
                              "rounded-full border px-2.5 py-1 text-xs font-black",
                              tripStatusClasses[trip.status],
                            ].join(" ")}
                          >
                            {tripStatusLabels[trip.status]}
                          </span>

                          <span className="text-sm font-black text-slate-950">
                            {formatDate(trip.date)}{" "}
                            {trip.startTime}
                          </span>
                        </div>

                        <h3 className="mt-2 text-lg font-black text-slate-950">
                          {trip.actualPointName ||
                            trip.plannedPointName}
                        </h3>

                        {trip.actualPointName &&
                        trip.actualPointName !==
                          trip.plannedPointName ? (
                          <p className="mt-1 text-xs font-semibold text-slate-400">
                            예정 포인트:{" "}
                            {trip.plannedPointName}
                          </p>
                        ) : null}

                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold text-slate-500">
                          <span>
                            보트: {trip.boatName || "-"}
                          </span>
                          <span>
                            가이드: {trip.guideName || "-"}
                          </span>
                          <span>
                            정원:{" "}
                            {trip.capacity > 0
                              ? `${trip.capacity}명`
                              : "제한 없음"}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          type="button"
                          disabled={isGroupLocked}
                          onClick={() =>
                            openTripEditForm(trip)
                          }
                          aria-label="회차 수정"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          disabled={isGroupLocked}
                          onClick={() =>
                            openBoardingForm(trip)
                          }
                          className="inline-flex h-10 items-center justify-center gap-1 rounded-xl bg-cyan-600 px-4 text-sm font-bold text-white hover:bg-cyan-700"
                        >
                          승선 관리
                          <ChevronRight className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          disabled={isGroupLocked}
                          onClick={() =>
                            void handleDeleteTrip(trip)
                          }
                          aria-label="회차 삭제"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 text-rose-500 hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 divide-x divide-slate-200 rounded-2xl border border-slate-200">
                      <div className="px-3 py-3 text-center">
                        <p className="text-xs font-semibold text-slate-400">
                          배정
                        </p>
                        <p className="mt-1 font-black text-slate-900">
                          {trip.participants.length}
                        </p>
                      </div>

                      <div className="px-3 py-3 text-center">
                        <p className="text-xs font-semibold text-slate-400">
                          승선 · 정산 대상
                        </p>
                        <p className="mt-1 font-black text-cyan-600">
                          {boardedCount}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {paymentFormOpen ? (
        <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-slate-950/60 sm:items-center sm:p-6">
          <button
            type="button"
            aria-label="결제 등록 창 닫기"
            onClick={closePaymentForm}
            className="absolute inset-0"
          />

          <div className="relative z-10 max-h-[94dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-black text-blue-600">
                  PAYMENT
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-950">
                  결제 등록
                </h2>
              </div>

              <button
                type="button"
                onClick={closePaymentForm}
                disabled={paymentSubmitting}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit}>
              <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                <label>
                  <span className="text-sm font-bold text-slate-700">
                    결제 금액
                  </span>
                  <input
                    type="number"
                    min={1}
                    step={1000}
                    value={paymentForm.amount}
                    onChange={(event) =>
                      setPaymentForm((previous) => ({
                        ...previous,
                        amount: event.target.value,
                      }))
                    }
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-blue-500"
                  />
                </label>

                <label>
                  <span className="text-sm font-bold text-slate-700">
                    결제 방식
                  </span>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(event) =>
                      setPaymentForm((previous) => ({
                        ...previous,
                        paymentMethod:
                          event.target
                            .value as GroupDivePaymentMethod,
                      }))
                    }
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none focus:border-blue-500"
                  >
                    {Object.entries(paymentMethodLabels).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label>
                  <span className="text-sm font-bold text-slate-700">
                    결제 일시
                  </span>
                  <input
                    type="datetime-local"
                    value={paymentForm.paidAt}
                    onChange={(event) =>
                      setPaymentForm((previous) => ({
                        ...previous,
                        paidAt: event.target.value,
                      }))
                    }
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-blue-500"
                  />
                </label>

                <label>
                  <span className="text-sm font-bold text-slate-700">
                    처리자
                  </span>
                  <input
                    type="text"
                    value={paymentForm.processedByName}
                    onChange={(event) =>
                      setPaymentForm((previous) => ({
                        ...previous,
                        processedByName: event.target.value,
                      }))
                    }
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-blue-500"
                  />
                </label>

                <label className="sm:col-span-2">
                  <span className="text-sm font-bold text-slate-700">
                    메모
                  </span>
                  <textarea
                    rows={4}
                    value={paymentForm.memo}
                    onChange={(event) =>
                      setPaymentForm((previous) => ({
                        ...previous,
                        memo: event.target.value,
                      }))
                    }
                    placeholder="예: 예약금, 잔금, 현장 카드 결제"
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </label>

                {paymentMessage ? (
                  <div className="sm:col-span-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                    {paymentMessage}
                  </div>
                ) : null}
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
                <button
                  type="button"
                  onClick={closePaymentForm}
                  disabled={paymentSubmitting}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 disabled:opacity-50"
                >
                  취소
                </button>

                <button
                  type="submit"
                  disabled={paymentSubmitting}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white disabled:opacity-60"
                >
                  {paymentSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  결제 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {settlementFormOpen && settlementForm ? (
        <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-slate-950/60 sm:items-center sm:p-6">
          <button
            type="button"
            aria-label="정산 수정 창 닫기"
            onClick={closeSettlementForm}
            className="absolute inset-0"
          />

          <div className="relative z-10 max-h-[94dvh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-black text-emerald-600">
                  SETTLEMENT
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-950">
                  그룹 다이빙 정산 수정
                </h2>
              </div>

              <button
                type="button"
                onClick={closeSettlementForm}
                disabled={settlementSubmitting}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSettlementSubmit}>
              <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                      <p className="text-xs font-bold text-slate-500">
                        기본 이용금액
                      </p>
                      <p className="mt-1 font-black text-slate-950">
                        {formatCurrency(
                          settlementSummary?.baseAmount ?? 0,
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-500">
                        현재 최종 금액
                      </p>
                      <p className="mt-1 font-black text-slate-950">
                        {formatCurrency(
                          settlementSummary?.finalAmount ?? 0,
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-500">
                        현재 결제액
                      </p>
                      <p className="mt-1 font-black text-emerald-600">
                        {formatCurrency(
                          settlementSummary?.paidAmount ?? 0,
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-500">
                        현재 미수금
                      </p>
                      <p className="mt-1 font-black text-rose-600">
                        {formatCurrency(
                          settlementSummary?.unpaidAmount ?? 0,
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <label>
                  <span className="text-sm font-bold text-slate-700">
                    추가 비용
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={settlementForm.additionalAmount}
                    onChange={(event) =>
                      setSettlementForm((previous) =>
                        previous
                          ? {
                              ...previous,
                              additionalAmount:
                                event.target.value,
                            }
                          : previous,
                      )
                    }
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-emerald-500"
                  />
                </label>

                <label>
                  <span className="text-sm font-bold text-slate-700">
                    할인 금액
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={settlementForm.discountAmount}
                    onChange={(event) =>
                      setSettlementForm((previous) =>
                        previous
                          ? {
                              ...previous,
                              discountAmount:
                                event.target.value,
                            }
                          : previous,
                      )
                    }
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-emerald-500"
                  />
                </label>

                <label>
                  <span className="text-sm font-bold text-slate-700">
                    실제 결제 금액
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={settlementForm.paidAmount}
                    onChange={(event) =>
                      setSettlementForm((previous) =>
                        previous
                          ? {
                              ...previous,
                              paidAmount:
                                event.target.value,
                            }
                          : previous,
                      )
                    }
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-emerald-500"
                  />
                </label>

                <label>
                  <span className="text-sm font-bold text-slate-700">
                    결제 방식
                  </span>
                  <select
                    value={settlementForm.paymentMethod}
                    onChange={(event) =>
                      setSettlementForm((previous) =>
                        previous
                          ? {
                              ...previous,
                              paymentMethod:
                                event.target
                                  .value as SettlementFormState["paymentMethod"],
                            }
                          : previous,
                      )
                    }
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none focus:border-emerald-500"
                  >
                    <option value="">미설정</option>
                    {Object.entries(paymentMethodLabels).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label className="sm:col-span-2">
                  <span className="text-sm font-bold text-slate-700">
                    정산 상태
                  </span>
                  <select
                    value={settlementForm.status}
                    onChange={(event) =>
                      setSettlementForm((previous) =>
                        previous
                          ? {
                              ...previous,
                              status:
                                event.target
                                  .value as GroupDiveSettlementStatus,
                            }
                          : previous,
                      )
                    }
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none focus:border-emerald-500"
                  >
                    {Object.entries(
                      settlementStatusLabels,
                    ).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-2 text-xs font-semibold text-slate-400">
                    결제 금액과 최종 금액에 맞지 않는 상태는 저장되지 않습니다.
                  </p>
                </label>

                <label className="sm:col-span-2">
                  <span className="text-sm font-bold text-slate-700">
                    정산 메모
                  </span>
                  <textarea
                    rows={4}
                    value={settlementForm.memo}
                    onChange={(event) =>
                      setSettlementForm((previous) =>
                        previous
                          ? {
                              ...previous,
                              memo: event.target.value,
                            }
                          : previous,
                      )
                    }
                    placeholder="예: 장비 대여비 포함, 대표자 계좌이체 예정"
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
                  />
                </label>

                {settlementMessage ? (
                  <div className="sm:col-span-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                    {settlementMessage}
                  </div>
                ) : null}
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
                <button
                  type="button"
                  onClick={closeSettlementForm}
                  disabled={settlementSubmitting}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 disabled:opacity-50"
                >
                  취소
                </button>

                <button
                  type="submit"
                  disabled={settlementSubmitting}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white disabled:opacity-60"
                >
                  {settlementSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  정산 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {groupFormOpen && groupForm ? (
        <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-slate-950/60 sm:items-center sm:p-6">
          <button
            type="button"
            aria-label="그룹 정보 수정 창 닫기"
            onClick={closeGroupEditForm}
            className="absolute inset-0"
          />

          <div className="relative z-10 max-h-[94dvh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-black text-cyan-600">
                  GROUP INFORMATION
                </p>
                <h2 className="mt-1 text-xl font-black text-slate-950">
                  그룹 기본정보 수정
                </h2>
              </div>

              <button
                type="button"
                onClick={closeGroupEditForm}
                disabled={groupSubmitting}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleGroupSubmit}>
              <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                <label className="sm:col-span-2">
                  <span className="text-sm font-bold text-slate-700">
                    팀명
                  </span>
                  <input
                    type="text"
                    value={groupForm.groupName}
                    onChange={(event) =>
                      setGroupForm((previous) =>
                        previous
                          ? {
                              ...previous,
                              groupName: event.target.value,
                            }
                          : previous,
                      )
                    }
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  />
                </label>

                <label>
                  <span className="text-sm font-bold text-slate-700">
                    대표자 이름
                  </span>
                  <input
                    type="text"
                    value={groupForm.representativeName}
                    onChange={(event) =>
                      setGroupForm((previous) =>
                        previous
                          ? {
                              ...previous,
                              representativeName:
                                event.target.value,
                            }
                          : previous,
                      )
                    }
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  />
                </label>

                <label>
                  <span className="text-sm font-bold text-slate-700">
                    대표자 연락처
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={13}
                    value={groupForm.representativePhone}
                    onChange={(event) =>
                      setGroupForm((previous) =>
                        previous
                          ? {
                              ...previous,
                              representativePhone:
                                formatPhoneInput(
                                  event.target.value,
                                ),
                            }
                          : previous,
                      )
                    }
                    placeholder="010-0000-0000"
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  />
                </label>

                <label>
                  <span className="text-sm font-bold text-slate-700">
                    시작일
                  </span>
                  <input
                    type="date"
                    value={groupForm.startDate}
                    onChange={(event) =>
                      setGroupForm((previous) =>
                        previous
                          ? {
                              ...previous,
                              startDate: event.target.value,
                            }
                          : previous,
                      )
                    }
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-cyan-500"
                  />
                </label>

                <label>
                  <span className="text-sm font-bold text-slate-700">
                    종료일
                  </span>
                  <input
                    type="date"
                    min={groupForm.startDate || undefined}
                    value={groupForm.endDate}
                    onChange={(event) =>
                      setGroupForm((previous) =>
                        previous
                          ? {
                              ...previous,
                              endDate: event.target.value,
                            }
                          : previous,
                      )
                    }
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-cyan-500"
                  />
                </label>

                <label>
                  <span className="text-sm font-bold text-slate-700">
                    예상 인원
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={groupForm.expectedPeople}
                    onChange={(event) =>
                      setGroupForm((previous) =>
                        previous
                          ? {
                              ...previous,
                              expectedPeople:
                                event.target.value,
                            }
                          : previous,
                      )
                    }
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-cyan-500"
                  />
                </label>

                <label>
                  <span className="text-sm font-bold text-slate-700">
                    상태
                  </span>
                  <select
                    value={groupForm.status}
                    onChange={(event) =>
                      setGroupForm((previous) =>
                        previous
                          ? {
                              ...previous,
                              status:
                                event.target
                                  .value as GroupDiveStatus,
                            }
                          : previous,
                      )
                    }
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none focus:border-cyan-500"
                  >
                    {Object.entries(groupStatusLabels).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label>
                  <span className="text-sm font-bold text-slate-700">
                    정산 방식
                  </span>
                  <select
                    value={groupForm.billingType}
                    onChange={(event) =>
                      setGroupForm((previous) =>
                        previous
                          ? {
                              ...previous,
                              billingType:
                                event.target
                                  .value as GroupDiveBillingType,
                            }
                          : previous,
                      )
                    }
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4 outline-none focus:border-cyan-500"
                  >
                    <option value="GROUP">
                      팀 대표자 일괄 정산
                    </option>
                    <option value="INDIVIDUAL">
                      참가자 개인별 정산
                    </option>
                  </select>
                </label>

                <label>
                  <span className="text-sm font-bold text-slate-700">
                    기본 1회 단가
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={1000}
                    value={groupForm.defaultDiveUnitPrice}
                    onChange={(event) =>
                      setGroupForm((previous) =>
                        previous
                          ? {
                              ...previous,
                              defaultDiveUnitPrice:
                                event.target.value,
                            }
                          : previous,
                      )
                    }
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-cyan-500"
                  />
                </label>

                <label className="sm:col-span-2">
                  <span className="text-sm font-bold text-slate-700">
                    메모
                  </span>
                  <textarea
                    rows={4}
                    value={groupForm.memo}
                    onChange={(event) =>
                      setGroupForm((previous) =>
                        previous
                          ? {
                              ...previous,
                              memo: event.target.value,
                            }
                          : previous,
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500"
                  />
                </label>

                {groupMessage ? (
                  <div className="sm:col-span-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                    {groupMessage}
                  </div>
                ) : null}
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
                <button
                  type="button"
                  onClick={closeGroupEditForm}
                  disabled={groupSubmitting}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 disabled:opacity-50"
                >
                  취소
                </button>

                <button
                  type="submit"
                  disabled={groupSubmitting}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-600 px-5 text-sm font-bold text-white disabled:opacity-60"
                >
                  {groupSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {participantFormOpen ? (
        <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-slate-950/60 sm:items-center sm:p-6">
          <button
            type="button"
            aria-label="참가자 창 닫기"
            onClick={closeParticipantForm}
            className="absolute inset-0"
          />

          <div className="relative z-10 max-h-[94dvh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-xl font-black text-slate-950">
                {editingParticipantId
                  ? "참가자 수정"
                  : "참가자 등록"}
              </h2>

              <button
                type="button"
                onClick={closeParticipantForm}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleParticipantSubmit}>
              <div className="grid gap-5 p-5 sm:grid-cols-2">
                <label>
                  <span className="text-sm font-bold text-slate-700">
                    이름
                  </span>
                  <input
                    type="text"
                    value={participantForm.name}
                    onChange={(event) =>
                      setParticipantForm(
                        (previous) => ({
                          ...previous,
                          name: event.target.value,
                        }),
                      )
                    }
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-cyan-500"
                  />
                </label>

                <label>
                  <span className="text-sm font-bold text-slate-700">
                    연락처
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={13}
                    value={participantForm.phone}
                    onChange={(event) =>
                      setParticipantForm(
                        (previous) => ({
                          ...previous,
                          phone: formatPhoneInput(
                            event.target.value,
                          ),
                        }),
                      )
                    }
                    placeholder="010-0000-0000"
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-cyan-500"
                  />
                </label>

                <label>
                  <span className="text-sm font-bold text-slate-700">
                    자격증
                  </span>
                  <input
                    type="text"
                    value={
                      participantForm.certification
                    }
                    onChange={(event) =>
                      setParticipantForm(
                        (previous) => ({
                          ...previous,
                          certification:
                            event.target.value,
                        }),
                      )
                    }
                    placeholder="예: AOW"
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-cyan-500"
                  />
                </label>

                <label className="flex items-end">
                  <span className="flex h-12 w-full items-center gap-3 rounded-xl border border-slate-200 px-4">
                    <input
                      type="checkbox"
                      checked={
                        participantForm.nitroxDefault
                      }
                      onChange={(event) =>
                        setParticipantForm(
                          (previous) => ({
                            ...previous,
                            nitroxDefault:
                              event.target.checked,
                          }),
                        )
                      }
                      className="h-4 w-4"
                    />
                    <span className="text-sm font-bold text-slate-700">
                      나이트록스 기본 사용
                    </span>
                  </span>
                </label>

                <label className="sm:col-span-2">
                  <span className="text-sm font-bold text-slate-700">
                    대여 장비
                  </span>
                  <input
                    type="text"
                    value={
                      participantForm.rentalItemsText
                    }
                    onChange={(event) =>
                      setParticipantForm(
                        (previous) => ({
                          ...previous,
                          rentalItemsText:
                            event.target.value,
                        }),
                      )
                    }
                    placeholder="BCD, 호흡기, 슈트"
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-cyan-500"
                  />
                </label>

                <label className="sm:col-span-2">
                  <span className="text-sm font-bold text-slate-700">
                    메모
                  </span>
                  <textarea
                    rows={3}
                    value={participantForm.memo}
                    onChange={(event) =>
                      setParticipantForm(
                        (previous) => ({
                          ...previous,
                          memo: event.target.value,
                        }),
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-cyan-500"
                  />
                </label>

                {participantMessage ? (
                  <div className="sm:col-span-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                    {participantMessage}
                  </div>
                ) : null}
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">
                <button
                  type="button"
                  onClick={closeParticipantForm}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700"
                >
                  취소
                </button>

                <button
                  type="submit"
                  disabled={participantSubmitting}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-600 px-5 text-sm font-bold text-white disabled:opacity-60"
                >
                  {participantSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {tripFormOpen ? (
        <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-slate-950/60 sm:items-center sm:p-6">
          <button
            type="button"
            onClick={closeTripForm}
            className="absolute inset-0"
          />

          <div className="relative z-10 max-h-[94dvh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h2 className="text-xl font-black text-slate-950">
                {editingTripId
                  ? "다이빙 회차 수정"
                  : "다이빙 회차 등록"}
              </h2>

              <button
                type="button"
                onClick={closeTripForm}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleTripSubmit}>
              <div className="grid gap-5 p-5 sm:grid-cols-2">
                <label>
                  <span className="text-sm font-bold text-slate-700">
                    날짜
                  </span>
                  <input
                    type="date"
                    min={groupDive.startDate}
                    max={groupDive.endDate}
                    value={tripForm.date}
                    onChange={(event) =>
                      setTripForm((previous) => ({
                        ...previous,
                        date: event.target.value,
                      }))
                    }
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4"
                  />
                </label>

                <label>
                  <span className="text-sm font-bold text-slate-700">
                    출항 시간
                  </span>
                  <input
                    type="time"
                    value={tripForm.startTime}
                    onChange={(event) =>
                      setTripForm((previous) => ({
                        ...previous,
                        startTime: event.target.value,
                      }))
                    }
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4"
                  />
                </label>

                <label>
                  <span className="text-sm font-bold text-slate-700">
                    예정 포인트
                  </span>
                  <input
                    type="text"
                    value={tripForm.plannedPointName}
                    onChange={(event) =>
                      setTripForm((previous) => ({
                        ...previous,
                        plannedPointName:
                          event.target.value,
                      }))
                    }
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4"
                  />
                </label>

                <label>
                  <span className="text-sm font-bold text-slate-700">
                    실제 포인트
                  </span>
                  <input
                    type="text"
                    value={tripForm.actualPointName}
                    onChange={(event) =>
                      setTripForm((previous) => ({
                        ...previous,
                        actualPointName:
                          event.target.value,
                      }))
                    }
                    placeholder="출항 후 변경 시 입력"
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4"
                  />
                </label>

                <label>
                  <span className="text-sm font-bold text-slate-700">
                    보트명
                  </span>
                  <input
                    type="text"
                    value={tripForm.boatName}
                    onChange={(event) =>
                      setTripForm((previous) => ({
                        ...previous,
                        boatName: event.target.value,
                      }))
                    }
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4"
                  />
                </label>

                <label>
                  <span className="text-sm font-bold text-slate-700">
                    가이드
                  </span>
                  <input
                    type="text"
                    value={tripForm.guideName}
                    onChange={(event) =>
                      setTripForm((previous) => ({
                        ...previous,
                        guideName: event.target.value,
                      }))
                    }
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4"
                  />
                </label>

                <label>
                  <span className="text-sm font-bold text-slate-700">
                    보트 정원
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={tripForm.capacity}
                    onChange={(event) =>
                      setTripForm((previous) => ({
                        ...previous,
                        capacity: event.target.value,
                      }))
                    }
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4"
                  />
                </label>

                <label>
                  <span className="text-sm font-bold text-slate-700">
                    상태
                  </span>
                  <select
                    value={tripForm.status}
                    onChange={(event) =>
                      setTripForm((previous) => ({
                        ...previous,
                        status: event.target
                          .value as GroupDiveTripStatus,
                      }))
                    }
                    className="mt-2 h-12 w-full rounded-xl border border-slate-200 bg-white px-4"
                  >
                    {Object.entries(
                      tripStatusLabels,
                    ).map(([value, label]) => (
                      <option
                        key={value}
                        value={value}
                      >
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="sm:col-span-2">
                  <span className="text-sm font-bold text-slate-700">
                    메모
                  </span>
                  <textarea
                    rows={3}
                    value={tripForm.memo}
                    onChange={(event) =>
                      setTripForm((previous) => ({
                        ...previous,
                        memo: event.target.value,
                      }))
                    }
                    className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3"
                  />
                </label>

                {tripMessage ? (
                  <div className="sm:col-span-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                    {tripMessage}
                  </div>
                ) : null}
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">
                <button
                  type="button"
                  onClick={closeTripForm}
                  className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700"
                >
                  취소
                </button>

                <button
                  type="submit"
                  disabled={tripSubmitting}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white disabled:opacity-60"
                >
                  {tripSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingTripId ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {editingTripId ? "저장" : "등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {boardingTrip ? (
        <div className="fixed inset-0 z-[10000] flex items-end justify-center bg-slate-950/60 sm:items-center sm:p-6">
          <button
            type="button"
            onClick={closeBoardingForm}
            className="absolute inset-0"
          />

          <div className="relative z-10 flex max-h-[94dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-xl font-black text-slate-950">
                  승선 및 정산 관리
                </h2>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {formatDate(boardingTrip.date)}{" "}
                  {boardingTrip.startTime} ·{" "}
                  {boardingTrip.actualPointName ||
                    boardingTrip.plannedPointName}
                </p>
              </div>

              <button
                type="button"
                onClick={closeBoardingForm}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-3">
              <p className="text-sm font-bold text-slate-700">
                승선{" "}
                {
                  boardingParticipants.filter(
                    (participant) =>
                      participant.boarded,
                  ).length
                }
                명 / 정원{" "}
                {boardingTrip.capacity > 0
                  ? `${boardingTrip.capacity}명`
                  : "제한 없음"}
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAllBoarding}
                  className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700"
                >
                  전체 승선
                </button>

                <button
                  type="button"
                  onClick={clearAllBoarding}
                  className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700"
                >
                  전체 해제
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {boardingParticipants.length === 0 ? (
                <div className="flex min-h-64 items-center justify-center text-sm font-semibold text-slate-500">
                  등록된 참가자가 없습니다.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {boardingParticipants.map(
                    (participant) => (
                      <div
                        key={participant.participantId}
                        className="grid gap-4 px-5 py-4 md:grid-cols-[1fr_auto_auto_140px]"
                      >
                        <div>
                          <p className="font-black text-slate-950">
                            {participant.participantName}
                          </p>

                          <input
                            type="text"
                            value={participant.memo}
                            onChange={(event) =>
                              updateBoardingParticipant(
                                participant.participantId,
                                {
                                  memo: event.target.value,
                                },
                              )
                            }
                            placeholder="회차 메모"
                            className="mt-2 h-9 w-full rounded-lg border border-slate-200 px-3 text-xs"
                          />
                        </div>

                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                          <input
                            type="checkbox"
                            checked={participant.boarded}
                            onChange={(event) =>
                              updateBoardingParticipant(
                                participant.participantId,
                                {
                                  boarded:
                                    event.target.checked,
                                },
                              )
                            }
                            className="h-4 w-4"
                          />
                          승선
                        </label>


                        <label>
                          <span className="text-xs font-bold text-slate-500">
                            단가
                          </span>
                          <input
                            type="number"
                            min={0}
                            step={1000}
                            value={
                              participant.unitPrice ?? ""
                            }
                            onChange={(event) =>
                              updateBoardingParticipant(
                                participant.participantId,
                                {
                                  unitPrice:
                                    event.target.value
                                      ? Number(
                                          event.target
                                            .value,
                                        )
                                      : undefined,
                                },
                              )
                            }
                            className="mt-1 h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
                          />
                        </label>
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>

            {boardingMessage ? (
              <div className="shrink-0 border-t border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700">
                {boardingMessage}
              </div>
            ) : null}

            <div className="flex shrink-0 justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4">
              <button
                type="button"
                onClick={closeBoardingForm}
                className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700"
              >
                취소
              </button>

              <button
                type="button"
                onClick={() =>
                  void handleBoardingSubmit()
                }
                disabled={boardingSubmitting}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-cyan-600 px-5 text-sm font-bold text-white disabled:opacity-60"
              >
                {boardingSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                저장
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}