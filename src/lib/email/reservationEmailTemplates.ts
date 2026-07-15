import type { Reservation } from "@/lib/reservations/types";

type EmailTemplate = {
  subject: string;
  html: string;
};

function escapeHtml(value?: string) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatReservationDate(reservation: Reservation) {
  return reservation.reservationDate || reservation.date || "-";
}

function baseLayout(title: string, body: string) {
  return `
    <div style="margin:0;padding:0;background:#f8fafc;font-family:Arial,'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#0f172a;">
      <div style="max-width:640px;margin:0 auto;padding:32px 16px;">
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;">
          <div style="background:#0891b2;padding:28px 32px;color:#ffffff;">
            <div style="font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">
              성산스쿠버
            </div>
            <h1 style="margin:10px 0 0;font-size:24px;line-height:1.35;">
              ${escapeHtml(title)}
            </h1>
          </div>

          <div style="padding:32px;">
            ${body}
          </div>

          <div style="border-top:1px solid #e2e8f0;background:#f8fafc;padding:20px 32px;font-size:12px;line-height:1.6;color:#64748b;">
            <div>본 메일은 성산스쿠버 예약 시스템에서 자동 발송되었습니다.</div>
            <div>예약 변경이나 문의가 필요하시면 매장으로 연락해주세요.</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function reservationInfoTable(reservation: Reservation) {
  const rows = [
    ["예약자", reservation.name],
    ["연락처", reservation.phone],
    ["이메일", reservation.email],
    ["프로그램", reservation.program],
    ["예약일자", formatReservationDate(reservation)],
    ["인원", `${reservation.people}명`],
  ];

  return `
    <table style="width:100%;border-collapse:collapse;margin-top:20px;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
      <tbody>
        ${rows
          .map(
            ([label, value]) => `
              <tr>
                <th style="width:120px;background:#f8fafc;border-bottom:1px solid #e2e8f0;padding:13px 14px;text-align:left;font-size:13px;color:#475569;">
                  ${escapeHtml(label)}
                </th>
                <td style="border-bottom:1px solid #e2e8f0;padding:13px 14px;font-size:14px;color:#0f172a;font-weight:600;">
                  ${escapeHtml(value)}
                </td>
              </tr>
            `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function customerMessageBlock(reservation: Reservation) {
  if (!reservation.message?.trim()) {
    return "";
  }

  return `
    <div style="margin-top:22px;">
      <div style="margin-bottom:8px;font-size:13px;font-weight:700;color:#334155;">
        고객 요청사항
      </div>
      <div style="white-space:pre-wrap;border:1px solid #e2e8f0;background:#f8fafc;border-radius:14px;padding:16px;font-size:14px;line-height:1.7;color:#334155;">
        ${escapeHtml(reservation.message)}
      </div>
    </div>
  `;
}

function adminMemoBlock(reservation: Reservation) {
  if (!reservation.adminMemo?.trim()) {
    return "";
  }

  return `
    <div style="margin-top:22px;">
      <div style="margin-bottom:8px;font-size:13px;font-weight:700;color:#334155;">
        관리자 안내
      </div>
      <div style="white-space:pre-wrap;border:1px solid #e2e8f0;background:#f8fafc;border-radius:14px;padding:16px;font-size:14px;line-height:1.7;color:#334155;">
        ${escapeHtml(reservation.adminMemo)}
      </div>
    </div>
  `;
}

export function customerReservationReceivedEmail(
  reservation: Reservation
): EmailTemplate {
  return {
    subject: "[성산스쿠버] 예약 요청이 접수되었습니다.",
    html: baseLayout(
      "예약 요청이 접수되었습니다.",
      `
        <p style="margin:0;font-size:15px;line-height:1.8;color:#334155;">
          안녕하세요, ${escapeHtml(reservation.name)}님.<br />
          성산스쿠버 예약 요청이 정상적으로 접수되었습니다.
        </p>

        <p style="margin:16px 0 0;font-size:15px;line-height:1.8;color:#334155;">
          담당자가 예약 가능 여부를 확인한 뒤 예약 확정 안내를 드리겠습니다.
        </p>

        ${reservationInfoTable(reservation)}
        ${customerMessageBlock(reservation)}
      `
    ),
  };
}

export function adminReservationReceivedEmail(
  reservation: Reservation
): EmailTemplate {
  return {
    subject: `[성산스쿠버] 새 예약 접수 - ${reservation.name}`,
    html: baseLayout(
      "새 예약이 접수되었습니다.",
      `
        <p style="margin:0;font-size:15px;line-height:1.8;color:#334155;">
          관리자 페이지에서 예약 내용을 확인하고 상태를 처리해주세요.
        </p>

        ${reservationInfoTable(reservation)}
        ${customerMessageBlock(reservation)}

        <div style="margin-top:22px;font-size:13px;line-height:1.7;color:#64748b;">
          예약번호: ${escapeHtml(reservation.id)}
        </div>
      `
    ),
  };
}

export function customerReservationConfirmedEmail(
  reservation: Reservation
): EmailTemplate {
  return {
    subject: "[성산스쿠버] 예약이 확정되었습니다.",
    html: baseLayout(
      "예약이 확정되었습니다.",
      `
        <p style="margin:0;font-size:15px;line-height:1.8;color:#334155;">
          안녕하세요, ${escapeHtml(reservation.name)}님.<br />
          요청하신 성산스쿠버 예약이 확정되었습니다.
        </p>

        <p style="margin:16px 0 0;font-size:15px;line-height:1.8;color:#334155;">
          아래 예약 내용을 확인해주세요.
        </p>

        ${reservationInfoTable(reservation)}
        ${adminMemoBlock(reservation)}

        <div style="margin-top:24px;border-radius:14px;background:#ecfeff;border:1px solid #a5f3fc;padding:18px;font-size:14px;line-height:1.8;color:#155e75;">
          <strong>안내사항</strong><br />
          예약일 당일 기상 및 해양 상황에 따라 일정이 조정될 수 있습니다.<br />
          방문 전 준비물과 집결 시간은 별도로 안내드리겠습니다.
        </div>
      `
    ),
  };
}

export function customerReservationCancelledEmail(
  reservation: Reservation
): EmailTemplate {
  return {
    subject: "[성산스쿠버] 예약이 취소되었습니다.",
    html: baseLayout(
      "예약이 취소되었습니다.",
      `
        <p style="margin:0;font-size:15px;line-height:1.8;color:#334155;">
          안녕하세요, ${escapeHtml(reservation.name)}님.<br />
          요청하신 성산스쿠버 예약이 취소 처리되었습니다.
        </p>

        <p style="margin:16px 0 0;font-size:15px;line-height:1.8;color:#334155;">
          아래 예약 내용을 확인해주세요.
        </p>

        ${reservationInfoTable(reservation)}
        ${adminMemoBlock(reservation)}

        <div style="margin-top:24px;border-radius:14px;background:#fff7ed;border:1px solid #fed7aa;padding:18px;font-size:14px;line-height:1.8;color:#9a3412;">
          <strong>취소 안내</strong><br />
          예약 취소와 관련하여 문의가 있으시면 매장으로 연락해주세요.<br />
          다시 예약을 원하시면 홈페이지 예약 신청을 이용해주시면 됩니다.
        </div>
      `
    ),
  };
}
