import { getProgramLabel } from "@/lib/programs";
import type { Reservation } from "@/lib/reservations/types";

function formatSmsDate(value?: string) {
  const digits = String(value ?? "").replace(/\D/g, "");

  if (digits.length >= 8) {
    return digits.slice(0, 8);
  }

  return String(value ?? "").trim() || "-";
}

function formatSmsTime(value?: string) {
  return String(value ?? "").trim() || "예약 확인 후 안내";
}

export function customerReservationReceivedSms(reservation: Reservation) {
  const reservationDate = reservation.reservationDate || reservation.date || "";

  return [
    "성산일출봉 아래 경이로운 바다 세계로의 여행!!",
    "",
    "성산스쿠버리조트가 함께합니다.",
    "",
    "[본 메시지는 고객님의 예약확인 문자입니다.]",
    "",
    `고객성명 : ${reservation.name}님`,
    "",
    `유 형 : ${getProgramLabel(reservation.program)}`,
    "",
    `날 짜 : ${formatSmsDate(reservationDate)}`,
    "",
    `시 간 대 : ${formatSmsTime(reservation.experienceTime)}`,
    "",
    `인 원 : ${reservation.people}명`,
    "",
    "준 비 물 : 수영복 or 속옷 여벌",
    "",
    "- 주소 : 제주도 서귀포시 성산읍 일출로 258-5",
    "",
    "- 환불 규정 : 당일취소불가",
    "",
    "- 업무시간 : 08:30 ~ 18:30",
    "",
    "- 예약의 변경/취소/환불은 구매처로 문의바라며, 다이빙 관련 문의는 064-782-6117로 연락바랍니다.",
    "",
    "- 즐거운 다이빙을 하실 수 있도록 최선을 다하겠습니다.",
    "",
    "감사합니다!",
  ].join("\n");
}
