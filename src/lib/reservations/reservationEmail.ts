import { SendEmailCommand, SESClient } from "@aws-sdk/client-ses";

export type ReservationStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";

export type ReservationForEmail = {
  id: string;
  name: string;
  phone: string;
  email?: string;
  program: string;
  reservationDate: string;
  people: number;
  message?: string;
  status: ReservationStatus;
  adminMemo?: string;
  experienceTime?: string;
  createdAt?: string;
  updatedAt?: string;
};

type EmailResult = {
  sent: boolean;
  skippedReason?: string;
  error?: string;
};

const sesClient = new SESClient({
  region: process.env.AWS_REGION || "ap-northeast-2",
});

const SHOP_NAME = process.env.SHOP_NAME || "SEONG SAN SCUBA Dive Center";
const SHOP_LOCATION =
  process.env.SHOP_LOCATION || "제주 성산 일대, 예약 확정 후 상세 위치 안내";
const SHOP_PHONE = process.env.SHOP_PHONE || "예약 확정 후 안내";
const SHOP_KAKAO = process.env.SHOP_KAKAO || "";
const SHOP_NOTICE =
  process.env.SHOP_NOTICE ||
  "해상 상황과 날씨에 따라 체험 시간이 변경되거나 취소될 수 있습니다.";

export async function sendReservationConfirmedEmail(
  reservation: ReservationForEmail,
): Promise<EmailResult> {
  if (!reservation.email) {
    return {
      sent: false,
      skippedReason: "고객 이메일 주소가 없어 발송하지 않았습니다.",
    };
  }

  const subject = `[${SHOP_NAME}] 예약이 확정되었습니다.`;

  const textBody = [
    `${reservation.name}님, 안녕하세요.`,
    ``,
    `${SHOP_NAME}입니다.`,
    `예약이 확정되었습니다.`,
    ``,
    `[예약 정보]`,
    `- 프로그램: ${reservation.program}`,
    `- 예약일: ${reservation.reservationDate}`,
    `- 체험시간: ${reservation.experienceTime || "미정"}`,
    `- 예약 인원: ${reservation.people}명`,
    `- 고객 연락처: ${reservation.phone}`,
    ``,
    `[장소 안내]`,
    `- 위치: ${SHOP_LOCATION}`,
    `- 문의 연락처: ${SHOP_PHONE}`,
    SHOP_KAKAO ? `- 카카오톡: ${SHOP_KAKAO}` : "",
    ``,
    `[준비물]`,
    `- 수영복 또는 젖어도 되는 옷`,
    `- 수건`,
    `- 여벌 옷`,
    `- 개인 세면도구`,
    `- 멀미가 걱정되시는 분은 사전에 멀미약 준비를 권장드립니다.`,
    ``,
    `[주의사항]`,
    `- 음주 후 체험은 안전상 불가합니다.`,
    `- 건강 상태에 따라 체험이 제한될 수 있습니다.`,
    `- 예약 시간보다 여유 있게 도착해 주세요.`,
    `- ${SHOP_NOTICE}`,
    ``,
    `안전하고 즐거운 체험이 될 수 있도록 준비하겠습니다.`,
    `감사합니다.`,
    ``,
    `${SHOP_NAME}`,
  ]
    .filter(Boolean)
    .join("\n");

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #0f172a; max-width: 680px; margin: 0 auto;">
      <div style="padding: 24px; border: 1px solid #e2e8f0; border-radius: 18px; background: #ffffff;">
        <h2 style="margin: 0 0 16px; color: #0369a1;">예약이 확정되었습니다.</h2>

        <p style="margin: 0 0 16px;">
          ${escapeHtml(reservation.name)}님, 안녕하세요.<br />
          <strong>${escapeHtml(SHOP_NAME)}</strong>입니다.
        </p>

        <div style="margin: 20px 0; padding: 16px; border: 1px solid #bfdbfe; border-radius: 14px; background: #eff6ff;">
          <h3 style="margin: 0 0 12px; font-size: 16px; color: #1e3a8a;">예약 정보</h3>
          <p style="margin: 0 0 8px;"><strong>프로그램:</strong> ${escapeHtml(reservation.program)}</p>
          <p style="margin: 0 0 8px;"><strong>예약일:</strong> ${escapeHtml(reservation.reservationDate)}</p>
          <p style="margin: 0 0 8px;"><strong>체험시간:</strong> ${escapeHtml(reservation.experienceTime || "미정")}</p>
          <p style="margin: 0 0 8px;"><strong>예약 인원:</strong> ${reservation.people}명</p>
          <p style="margin: 0;"><strong>고객 연락처:</strong> ${escapeHtml(reservation.phone)}</p>
        </div>

        <div style="margin: 20px 0; padding: 16px; border: 1px solid #e2e8f0; border-radius: 14px; background: #f8fafc;">
          <h3 style="margin: 0 0 12px; font-size: 16px;">장소 안내</h3>
          <p style="margin: 0 0 8px;"><strong>위치:</strong> ${escapeHtml(SHOP_LOCATION)}</p>
          <p style="margin: 0 0 8px;"><strong>문의 연락처:</strong> ${escapeHtml(SHOP_PHONE)}</p>
          ${
            SHOP_KAKAO
              ? `<p style="margin: 0;"><strong>카카오톡:</strong> ${escapeHtml(SHOP_KAKAO)}</p>`
              : ""
          }
        </div>

        <div style="margin: 20px 0; padding: 16px; border: 1px solid #e2e8f0; border-radius: 14px; background: #f8fafc;">
          <h3 style="margin: 0 0 12px; font-size: 16px;">준비물</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li>수영복 또는 젖어도 되는 옷</li>
            <li>수건</li>
            <li>여벌 옷</li>
            <li>개인 세면도구</li>
            <li>멀미가 걱정되시는 분은 사전에 멀미약 준비를 권장드립니다.</li>
          </ul>
        </div>

        <div style="margin: 20px 0; padding: 16px; border: 1px solid #fde68a; border-radius: 14px; background: #fffbeb;">
          <h3 style="margin: 0 0 12px; font-size: 16px; color: #92400e;">주의사항</h3>
          <ul style="margin: 0; padding-left: 20px;">
            <li>음주 후 체험은 안전상 불가합니다.</li>
            <li>건강 상태에 따라 체험이 제한될 수 있습니다.</li>
            <li>예약 시간보다 여유 있게 도착해 주세요.</li>
            <li>${escapeHtml(SHOP_NOTICE)}</li>
          </ul>
        </div>

        <p style="margin: 20px 0 0;">
          안전하고 즐거운 체험이 될 수 있도록 준비하겠습니다.<br />
          감사합니다.
        </p>

        <p style="margin: 16px 0 0; font-weight: bold;">
          ${escapeHtml(SHOP_NAME)}
        </p>
      </div>
    </div>
  `;

  return sendCustomerEmail({
    to: reservation.email,
    subject,
    textBody,
    htmlBody,
  });
}

export async function sendReservationCancelledEmail(
  reservation: ReservationForEmail,
): Promise<EmailResult> {
  if (!reservation.email) {
    return {
      sent: false,
      skippedReason: "고객 이메일 주소가 없어 발송하지 않았습니다.",
    };
  }

  const subject = `[${SHOP_NAME}] 예약이 취소되었습니다.`;

  const textBody = [
    `${reservation.name}님, 안녕하세요.`,
    ``,
    `${SHOP_NAME}입니다.`,
    `예약이 취소 처리되었습니다.`,
    ``,
    `[취소된 예약 정보]`,
    `- 프로그램: ${reservation.program}`,
    `- 예약일: ${reservation.reservationDate}`,
    `- 체험시간: ${reservation.experienceTime || "미정"}`,
    `- 예약 인원: ${reservation.people}명`,
    `- 고객 연락처: ${reservation.phone}`,
    ``,
    `예약 관련 문의가 있으시면 아래 연락처로 문의해 주세요.`,
    `- 문의 연락처: ${SHOP_PHONE}`,
    SHOP_KAKAO ? `- 카카오톡: ${SHOP_KAKAO}` : "",
    ``,
    `감사합니다.`,
    ``,
    `${SHOP_NAME}`,
  ]
    .filter(Boolean)
    .join("\n");

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #0f172a; max-width: 680px; margin: 0 auto;">
      <div style="padding: 24px; border: 1px solid #e2e8f0; border-radius: 18px; background: #ffffff;">
        <h2 style="margin: 0 0 16px; color: #be123c;">예약이 취소되었습니다.</h2>

        <p style="margin: 0 0 16px;">
          ${escapeHtml(reservation.name)}님, 안녕하세요.<br />
          <strong>${escapeHtml(SHOP_NAME)}</strong>입니다.
        </p>

        <p style="margin: 0 0 16px;">
          예약이 취소 처리되었습니다.
        </p>

        <div style="margin: 20px 0; padding: 16px; border: 1px solid #fecdd3; border-radius: 14px; background: #fff1f2;">
          <h3 style="margin: 0 0 12px; font-size: 16px; color: #9f1239;">취소된 예약 정보</h3>
          <p style="margin: 0 0 8px;"><strong>프로그램:</strong> ${escapeHtml(reservation.program)}</p>
          <p style="margin: 0 0 8px;"><strong>예약일:</strong> ${escapeHtml(reservation.reservationDate)}</p>
          <p style="margin: 0 0 8px;"><strong>체험시간:</strong> ${escapeHtml(reservation.experienceTime || "미정")}</p>
          <p style="margin: 0 0 8px;"><strong>예약 인원:</strong> ${reservation.people}명</p>
          <p style="margin: 0;"><strong>고객 연락처:</strong> ${escapeHtml(reservation.phone)}</p>
        </div>

        <div style="margin: 20px 0; padding: 16px; border: 1px solid #e2e8f0; border-radius: 14px; background: #f8fafc;">
          <h3 style="margin: 0 0 12px; font-size: 16px;">문의 안내</h3>
          <p style="margin: 0 0 8px;"><strong>문의 연락처:</strong> ${escapeHtml(SHOP_PHONE)}</p>
          ${
            SHOP_KAKAO
              ? `<p style="margin: 0;"><strong>카카오톡:</strong> ${escapeHtml(SHOP_KAKAO)}</p>`
              : ""
          }
        </div>

        <p style="margin: 20px 0 0;">감사합니다.</p>

        <p style="margin: 16px 0 0; font-weight: bold;">
          ${escapeHtml(SHOP_NAME)}
        </p>
      </div>
    </div>
  `;

  return sendCustomerEmail({
    to: reservation.email,
    subject,
    textBody,
    htmlBody,
  });
}

async function sendCustomerEmail({
  to,
  subject,
  textBody,
  htmlBody,
}: {
  to: string;
  subject: string;
  textBody: string;
  htmlBody: string;
}): Promise<EmailResult> {
  try {
    const fromEmail = process.env.SES_FROM_EMAIL;

    if (!fromEmail) {
      return {
        sent: false,
        skippedReason: "SES_FROM_EMAIL 환경변수가 없어 발송하지 않았습니다.",
      };
    }

    await sesClient.send(
      new SendEmailCommand({
        Source: fromEmail,
        Destination: {
          ToAddresses: [to],
        },
        Message: {
          Subject: {
            Charset: "UTF-8",
            Data: subject,
          },
          Body: {
            Text: {
              Charset: "UTF-8",
              Data: textBody,
            },
            Html: {
              Charset: "UTF-8",
              Data: htmlBody,
            },
          },
        },
      }),
    );

    return {
      sent: true,
    };
  } catch (error) {
    console.error("SES email send failed:", error);

    return {
      sent: false,
      error:
        error instanceof Error
          ? error.message
          : "이메일 발송 중 오류가 발생했습니다.",
    };
  }
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}