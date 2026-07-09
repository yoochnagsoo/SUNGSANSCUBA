"use client";

import type { ChangeEvent, DragEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { PROGRAM_OPTIONS, normalizeProgramValue } from "@/lib/programs";

type ReservationStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

type PaymentMethod =
  | "CASH"
  | "CARD"
  | "TRANSFER"
  | "NAVER_PAY"
  | "KAKAO_PAY"
  | "ETC";

type Reservation = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  program: string;
  reservationDate: string;
  date?: string;
  people: number;
  message?: string;
  status: ReservationStatus;
  adminMemo?: string;
  experienceTime?: string;
  paymentAmount?: number;
  paymentMethod?: PaymentMethod;
  paymentMemo?: string;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

type SaveResponse = {
  ok: boolean;
  reservation?: Reservation;
  message?: string;
  email?: {
    sent?: boolean;
    skippedReason?: string;
    error?: string;
  };
};

type ResendEmailResponse = {
  ok: boolean;
  message?: string;
  emailType?: "CONFIRMED" | "CANCELLED";
  email?: {
    sent?: boolean;
    skippedReason?: string;
    error?: string;
  };
};

type SendPhotosResponse = {
  ok: boolean;
  message?: string;
  sentTo?: string;
  photoCount?: number;
  zipSize?: number;
};

const STATUS_LABEL: Record<ReservationStatus, string> = {
  PENDING: "접수대기",
  CONFIRMED: "예약확정",
  CANCELLED: "취소",
  COMPLETED: "완료",
};

const STATUS_OPTIONS: ReservationStatus[] = [
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "COMPLETED",
];

const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  CASH: "현금",
  CARD: "카드",
  TRANSFER: "계좌이체",
  NAVER_PAY: "네이버페이",
  KAKAO_PAY: "카카오페이",
  ETC: "기타",
};

const PAYMENT_METHOD_OPTIONS: PaymentMethod[] = [
  "CASH",
  "CARD",
  "TRANSFER",
  "NAVER_PAY",
  "KAKAO_PAY",
  "ETC",
];

const EXPERIENCE_TIME_OPTIONS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
];

const MAX_PHOTO_TOTAL_SIZE = 25 * 1024 * 1024;

function formatBytes(bytes: number) {
  if (bytes === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, index);

  return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

function createPhotoKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

export default function AdminReservationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const reservationId = params.id;

  const [reservation, setReservation] = useState<Reservation | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [program, setProgram] = useState(PROGRAM_OPTIONS[0].value);
  const [reservationDate, setReservationDate] = useState("");
  const [people, setPeople] = useState(1);

  const [status, setStatus] = useState<ReservationStatus>("PENDING");
  const [adminMemo, setAdminMemo] = useState("");
  const [experienceTime, setExperienceTime] = useState("");

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [paymentMemo, setPaymentMemo] = useState("");

  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [isPhotoDragging, setIsPhotoDragging] = useState(false);
  const [sendingPhotos, setSendingPhotos] = useState(false);
  const [photoMessage, setPhotoMessage] = useState("");
  const [photoMessageType, setPhotoMessageType] = useState<
    "success" | "warning" | "error" | ""
  >("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resending, setResending] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailMessageType, setEmailMessageType] = useState<
    "success" | "warning" | "error" | ""
  >("");

  const createdAtText = useMemo(() => {
    if (!reservation?.createdAt) return "-";

    const date = new Date(reservation.createdAt);

    if (Number.isNaN(date.getTime())) {
      return reservation.createdAt;
    }

    return date.toLocaleString("ko-KR");
  }, [reservation]);

  const updatedAtText = useMemo(() => {
    if (!reservation?.updatedAt) return "-";

    const date = new Date(reservation.updatedAt);

    if (Number.isNaN(date.getTime())) {
      return reservation.updatedAt;
    }

    return date.toLocaleString("ko-KR");
  }, [reservation]);

  const completedAtText = useMemo(() => {
    if (!reservation?.completedAt) return "-";

    const date = new Date(reservation.completedAt);

    if (Number.isNaN(date.getTime())) {
      return reservation.completedAt;
    }

    return date.toLocaleString("ko-KR");
  }, [reservation]);

  const photoTotalSize = useMemo(
    () => photoFiles.reduce((total, file) => total + file.size, 0),
    [photoFiles],
  );

  const canResendEmail =
    reservation?.status === "CONFIRMED" || reservation?.status === "CANCELLED";

  const resendEmailButtonText =
    reservation?.status === "CONFIRMED"
      ? "확정 메일 다시 보내기"
      : reservation?.status === "CANCELLED"
        ? "취소 메일 다시 보내기"
        : "메일 다시 보내기";

  const canSendPhotos =
    reservation?.status === "COMPLETED" && Boolean(email.trim());

  useEffect(() => {
    async function fetchReservation() {
      try {
        setLoading(true);
        setErrorMessage("");
        setSuccessMessage("");
        setEmailMessage("");
        setEmailMessageType("");
        setPhotoMessage("");
        setPhotoMessageType("");

        const res = await fetch(`/api/reservations/${reservationId}`, {
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok || !data.ok) {
          throw new Error(data.message || "예약 정보를 불러오지 못했습니다.");
        }

        const item = data.reservation as Reservation;

        applyReservationToForm(item);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "예약 정보를 불러오지 못했습니다.";

        setErrorMessage(message);
      } finally {
        setLoading(false);
      }
    }

    if (reservationId) {
      fetchReservation();
    }
  }, [reservationId]);

  function applyReservationToForm(item: Reservation) {
    const nextReservationDate = item.reservationDate || item.date || "";
    const nextProgram = normalizeProgramValue(item.program);

    setReservation({
      ...item,
      program: nextProgram,
    });

    setName(item.name || "");
    setPhone(item.phone || "");
    setEmail(item.email || "");
    setProgram(nextProgram);
    setReservationDate(nextReservationDate);
    setPeople(Number(item.people || 1));

    setStatus(item.status || "PENDING");
    setAdminMemo(item.adminMemo || "");
    setExperienceTime(item.experienceTime || "");

    setPaymentAmount(
      typeof item.paymentAmount === "number" ? String(item.paymentAmount) : "",
    );
    setPaymentMethod(item.paymentMethod || "");
    setPaymentMemo(item.paymentMemo || "");
  }

  function showEmailResult(data: {
    email?: {
      sent?: boolean;
      skippedReason?: string;
      error?: string;
    };
  }) {
    if (!data.email) {
      return;
    }

    if (data.email.sent) {
      setEmailMessage("고객 안내 메일이 발송되었습니다.");
      setEmailMessageType("success");
    } else if (data.email.error) {
      setEmailMessage(`메일 발송 실패: ${data.email.error}`);
      setEmailMessageType("error");
    } else if (data.email.skippedReason) {
      setEmailMessage(`메일 발송 안 함: ${data.email.skippedReason}`);
      setEmailMessageType("warning");
    }
  }

  function addPhotoFiles(files: File[]) {
    setPhotoMessage("");
    setPhotoMessageType("");

    const imageFiles = files.filter(isImageFile);
    const rejectedCount = files.length - imageFiles.length;

    if (imageFiles.length === 0) {
      setPhotoMessage("이미지 파일만 업로드할 수 있습니다.");
      setPhotoMessageType("error");
      return;
    }

    setPhotoFiles((currentFiles) => {
      const existingKeys = new Set(currentFiles.map(createPhotoKey));
      const merged = [...currentFiles];

      for (const file of imageFiles) {
        const key = createPhotoKey(file);

        if (!existingKeys.has(key)) {
          merged.push(file);
          existingKeys.add(key);
        }
      }

      const nextTotalSize = merged.reduce((total, file) => total + file.size, 0);

      if (nextTotalSize > MAX_PHOTO_TOTAL_SIZE) {
        setPhotoMessage(
          `사진 총 용량은 최대 ${formatBytes(
            MAX_PHOTO_TOTAL_SIZE,
          )}까지 가능합니다. 현재 선택 용량: ${formatBytes(nextTotalSize)}`,
        );
        setPhotoMessageType("error");
        return currentFiles;
      }

      if (rejectedCount > 0) {
        setPhotoMessage(
          `이미지가 아닌 파일 ${rejectedCount}개는 제외했습니다.`,
        );
        setPhotoMessageType("warning");
      }

      return merged;
    });
  }

  function handlePhotoInputChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    addPhotoFiles(files);
    event.target.value = "";
  }

  function handlePhotoDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsPhotoDragging(false);

    const files = Array.from(event.dataTransfer.files);
    addPhotoFiles(files);
  }

  function removePhotoFile(index: number) {
    setPhotoFiles((currentFiles) =>
      currentFiles.filter((_file, fileIndex) => fileIndex !== index),
    );
  }

  function clearPhotoFiles() {
    setPhotoFiles([]);
    setPhotoMessage("");
    setPhotoMessageType("");
  }

  async function handleSave() {
    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");
      setEmailMessage("");
      setEmailMessageType("");

      const trimmedPaymentAmount = paymentAmount.trim();
      const hasPaymentAmount = trimmedPaymentAmount !== "";
      const nextPaymentAmount = hasPaymentAmount
        ? Number(trimmedPaymentAmount)
        : undefined;

      if (
        hasPaymentAmount &&
        (typeof nextPaymentAmount !== "number" ||
          Number.isNaN(nextPaymentAmount) ||
          nextPaymentAmount < 0)
      ) {
        throw new Error("결제금액을 올바르게 입력해주세요.");
      }

      if (status === "COMPLETED") {
        if (!hasPaymentAmount) {
          throw new Error("완료 처리 시 결제금액을 입력해주세요.");
        }

        if (!paymentMethod) {
          throw new Error("완료 처리 시 결제방법을 선택해주세요.");
        }
      }

      const res = await fetch(`/api/reservations/${reservationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
          email,
          program,
          reservationDate,
          people,
          status,
          adminMemo,
          experienceTime: experienceTime || "",

          paymentAmount: nextPaymentAmount,
          paymentMethod: paymentMethod || undefined,
          paymentMemo,
          completedAt:
            status === "COMPLETED"
              ? reservation?.completedAt || new Date().toISOString()
              : undefined,
        }),
      });

      const data = (await res.json()) as SaveResponse;

      if (!res.ok || !data.ok || !data.reservation) {
        throw new Error(data.message || "예약 정보를 저장하지 못했습니다.");
      }

      applyReservationToForm(data.reservation);

      setSuccessMessage("예약 정보가 저장되었습니다.");
      showEmailResult(data);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "예약 정보를 저장하지 못했습니다.";

      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleResendEmail() {
    if (!reservation) return;

    const confirmed = window.confirm(
      `${reservation.email || "고객 이메일"}로 안내 메일을 다시 보낼까요?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setResending(true);
      setErrorMessage("");
      setSuccessMessage("");
      setEmailMessage("");
      setEmailMessageType("");

      const res = await fetch(
        `/api/reservations/${reservationId}/resend-email`,
        {
          method: "POST",
        },
      );

      const data = (await res.json()) as ResendEmailResponse;

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "메일을 다시 보내지 못했습니다.");
      }

      showEmailResult(data);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "메일을 다시 보내지 못했습니다.";

      setEmailMessage(message);
      setEmailMessageType("error");
    } finally {
      setResending(false);
    }
  }

  async function handleSendPhotos() {
    if (!reservation) {
      return;
    }

    if (reservation.status !== "COMPLETED") {
      setPhotoMessage("완료 처리된 예약에서만 사진을 발송할 수 있습니다.");
      setPhotoMessageType("warning");
      return;
    }

    if (!email.trim()) {
      setPhotoMessage("고객 이메일이 없어 사진을 발송할 수 없습니다.");
      setPhotoMessageType("error");
      return;
    }

    if (photoFiles.length === 0) {
      setPhotoMessage("전송할 사진을 선택해주세요.");
      setPhotoMessageType("error");
      return;
    }

    if (photoTotalSize > MAX_PHOTO_TOTAL_SIZE) {
      setPhotoMessage(
        `사진 총 용량은 최대 ${formatBytes(MAX_PHOTO_TOTAL_SIZE)}까지 가능합니다.`,
      );
      setPhotoMessageType("error");
      return;
    }

    const confirmed = window.confirm(
      `${email}로 사진 ${photoFiles.length}장을 ZIP 파일로 발송할까요?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setSendingPhotos(true);
      setPhotoMessage("");
      setPhotoMessageType("");

      const formData = new FormData();

      for (const file of photoFiles) {
        formData.append("photos", file);
      }

      const res = await fetch(
        `/api/admin/reservations/${reservationId}/send-photos`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = (await res.json()) as SendPhotosResponse;

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "사진 메일을 발송하지 못했습니다.");
      }

      setPhotoMessage(
        `${data.sentTo || email}로 사진 ${data.photoCount || photoFiles.length}장을 발송했습니다.`,
      );
      setPhotoMessageType("success");
      setPhotoFiles([]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "사진 메일을 발송하지 못했습니다.";

      setPhotoMessage(message);
      setPhotoMessageType("error");
    } finally {
      setSendingPhotos(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">예약 정보를 불러오는 중입니다.</p>
        </div>
      </div>
    );
  }

  if (errorMessage && !reservation) {
    return (
      <div className="p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="font-semibold text-red-700">오류</p>
          <p className="mt-2 text-sm text-red-600">{errorMessage}</p>

          <button
            type="button"
            onClick={() => router.back()}
            className="mt-5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            뒤로가기
          </button>
        </div>
      </div>
    );
  }

  if (!reservation) {
    return null;
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">예약 상세</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{name}</h1>
        </div>

        <button
          type="button"
          onClick={() => router.push("/admin/reservations")}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          목록으로
        </button>
      </div>

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      {emailMessage ? (
        <div
          className={`rounded-2xl border p-4 text-sm font-semibold ${
            emailMessageType === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : emailMessageType === "warning"
                ? "border-amber-200 bg-amber-50 text-amber-700"
                : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {emailMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">고객 정보</h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <FormField label="이름" required>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </FormField>

              <FormField label="연락처" required>
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </FormField>

              <FormField label="이메일">
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="example@email.com"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </FormField>

              <InfoItem label="접수일시" value={createdAtText} />
              <InfoItem label="최근 수정일시" value={updatedAtText} />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">예약 정보</h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <FormField label="프로그램" required>
                <select
                  value={program}
                  onChange={(event) => setProgram(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  {PROGRAM_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="예약 희망일" required>
                <input
                  type="date"
                  value={reservationDate}
                  onChange={(event) => setReservationDate(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </FormField>

              <FormField label="인원" required>
                <input
                  type="number"
                  min={1}
                  value={people}
                  onChange={(event) => setPeople(Number(event.target.value))}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </FormField>

              <FormField label="체험시간">
                <select
                  value={experienceTime}
                  onChange={(event) => setExperienceTime(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="">시간 미지정</option>

                  {EXPERIENCE_TIME_OPTIONS.map((time) => (
                    <option key={time} value={time}>
                      {time}
                    </option>
                  ))}
                </select>
              </FormField>
            </div>

            <div className="mt-6">
              <p className="text-sm font-semibold text-slate-500">요청사항</p>
              <div className="mt-2 min-h-28 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                {reservation.message?.trim()
                  ? reservation.message
                  : "요청사항이 없습니다."}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-cyan-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  고객 사진 ZIP 메일 발송
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  촬영한 사진 여러 장을 드래그&드롭으로 올리면 ZIP 파일로 묶어
                  고객 이메일로 발송합니다.
                </p>
              </div>

              <div className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
                최대 {formatBytes(MAX_PHOTO_TOTAL_SIZE)}
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_220px]">
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsPhotoDragging(true);
                }}
                onDragLeave={() => setIsPhotoDragging(false)}
                onDrop={handlePhotoDrop}
                className={`flex min-h-52 items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition ${
                  isPhotoDragging
                    ? "border-cyan-500 bg-cyan-50"
                    : "border-slate-300 bg-slate-50"
                }`}
              >
                <div>
                  <p className="text-base font-bold text-slate-900">
                    사진을 여기에 드래그&드롭
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    JPG, PNG, WEBP, GIF 이미지를 여러 장 선택할 수 있습니다.
                  </p>

                  <label className="mt-4 inline-flex cursor-pointer rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white hover:bg-cyan-700">
                    사진 선택
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoInputChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-900">발송 정보</p>

                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <p>
                    고객 이메일:{" "}
                    <span className="font-bold text-slate-950">
                      {email || "이메일 없음"}
                    </span>
                  </p>
                  <p>
                    예약 상태:{" "}
                    <span className="font-bold text-slate-950">
                      {STATUS_LABEL[reservation.status]}
                    </span>
                  </p>
                  <p>
                    선택 사진:{" "}
                    <span className="font-bold text-slate-950">
                      {photoFiles.length}장
                    </span>
                  </p>
                  <p>
                    총 용량:{" "}
                    <span className="font-bold text-slate-950">
                      {formatBytes(photoTotalSize)}
                    </span>
                  </p>
                </div>

                {!canSendPhotos ? (
                  <div className="mt-4 rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-700">
                    사진 발송은 완료 상태이고 고객 이메일이 있는 예약에서만
                    가능합니다.
                  </div>
                ) : null}
              </div>
            </div>

            {photoFiles.length > 0 ? (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-bold text-slate-900">
                    선택된 사진
                  </p>

                  <button
                    type="button"
                    onClick={clearPhotoFiles}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    전체 비우기
                  </button>
                </div>

                <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
                  {photoFiles.map((file, index) => (
                    <div
                      key={createPhotoKey(file)}
                      className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {index + 1}. {file.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatBytes(file.size)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removePhotoFile(index)}
                        className="shrink-0 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-100"
                      >
                        제거
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {photoMessage ? (
              <div
                className={`mt-5 rounded-2xl border p-4 text-sm font-semibold ${
                  photoMessageType === "success"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : photoMessageType === "warning"
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {photoMessage}
              </div>
            ) : null}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleSendPhotos}
                disabled={
                  !canSendPhotos || photoFiles.length === 0 || sendingPhotos
                }
                className="rounded-xl bg-cyan-600 px-5 py-3 text-sm font-bold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {sendingPhotos ? "사진 메일 발송 중..." : "사진 ZIP 메일 발송"}
              </button>
            </div>
          </div>
        </section>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">관리자 처리</h2>

          <div className="mt-5 space-y-5">
            <div>
              <label className="text-sm font-semibold text-slate-600">
                예약 상태
              </label>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as ReservationStatus)
                }
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              >
                {STATUS_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {STATUS_LABEL[item]}
                  </option>
                ))}
              </select>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                예약확정 또는 취소로 상태가 변경되면 고객 이메일로 안내 메일이
                발송됩니다.
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
              <div>
                <p className="text-base font-bold text-emerald-950">
                  결제 정보
                </p>
                <p className="mt-1 text-xs leading-5 text-emerald-700">
                  완료 처리 시 결제금액과 결제방법이 필수입니다.
                </p>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-600">
                    결제금액
                    {status === "COMPLETED" ? (
                      <span className="ml-1 text-red-500">*</span>
                    ) : null}
                  </label>

                  <input
                    type="number"
                    min={0}
                    value={paymentAmount}
                    onChange={(event) => setPaymentAmount(event.target.value)}
                    placeholder="예: 80000"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-600">
                    결제방법
                    {status === "COMPLETED" ? (
                      <span className="ml-1 text-red-500">*</span>
                    ) : null}
                  </label>

                  <select
                    value={paymentMethod}
                    onChange={(event) =>
                      setPaymentMethod(event.target.value as PaymentMethod | "")
                    }
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  >
                    <option value="">결제방법 선택</option>

                    {PAYMENT_METHOD_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {PAYMENT_METHOD_LABEL[item]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-600">
                    결제 메모
                  </label>

                  <textarea
                    value={paymentMemo}
                    onChange={(event) => setPaymentMemo(event.target.value)}
                    rows={4}
                    placeholder="예: 현장 카드 결제 / 예약금 차감 / 할인 적용 등"
                    className="mt-2 w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                  />
                </div>

                {reservation.status === "COMPLETED" ? (
                  <div className="rounded-xl bg-white p-3 text-xs leading-5 text-emerald-800">
                    <p className="font-bold text-emerald-950">
                      저장된 완료 정보
                    </p>
                    <p className="mt-1">완료일시: {completedAtText}</p>
                    <p>
                      결제금액:{" "}
                      {reservation.paymentAmount?.toLocaleString("ko-KR") ||
                        "0"}
                      원
                    </p>
                    <p>
                      결제방법:{" "}
                      {reservation.paymentMethod
                        ? PAYMENT_METHOD_LABEL[reservation.paymentMethod]
                        : "-"}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-600">
                관리자 메모
              </label>

              <textarea
                value={adminMemo}
                onChange={(event) => setAdminMemo(event.target.value)}
                rows={7}
                placeholder="관리자용 메모를 입력하세요."
                className="mt-2 w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              <p className="font-bold text-slate-900">저장 안내</p>
              <p className="mt-1">프로그램명은 한글로 저장됩니다.</p>
              <p>예약확정 변경 시: 확정 안내 메일</p>
              <p>취소 변경 시: 취소 안내 메일</p>
              <p>같은 상태로 다시 저장 시: 중복 발송 안 함</p>
              <p>완료 변경 시: 결제 정보 저장</p>
              <p>완료 후 고객 사진 ZIP 메일 발송 가능</p>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {saving ? "저장 중..." : "저장하기"}
            </button>

            <button
              type="button"
              onClick={handleResendEmail}
              disabled={!canResendEmail || resending}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {resending ? "메일 발송 중..." : resendEmailButtonText}
            </button>

            {!canResendEmail ? (
              <p className="text-xs leading-5 text-slate-500">
                메일 재발송은 예약확정 또는 취소 상태에서만 가능합니다.
              </p>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-600">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </label>
      {children}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 break-words text-base font-bold text-slate-900">
        {value || "-"}
      </p>
    </div>
  );
}