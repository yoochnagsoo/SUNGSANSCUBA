import { SendRawEmailCommand, SESClient } from "@aws-sdk/client-ses";
import { NextRequest, NextResponse } from "next/server";

import { reservationRepository } from "@/lib/reservations/reservationRepository";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type ZipEntry = {
  name: string;
  buffer: Buffer;
  crc32: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
  dosTime: number;
  dosDate: number;
};

const MAX_TOTAL_FILE_SIZE = 25 * 1024 * 1024;

const allowedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

const crc32Table = (() => {
  const table = new Uint32Array(256);

  for (let index = 0; index < 256; index += 1) {
    let value = index;

    for (let bit = 0; bit < 8; bit += 1) {
      if (value & 1) {
        value = 0xedb88320 ^ (value >>> 1);
      } else {
        value = value >>> 1;
      }
    }

    table[index] = value >>> 0;
  }

  return table;
})();

function getCrc32(buffer: Buffer) {
  let crc = 0xffffffff;

  for (let index = 0; index < buffer.length; index += 1) {
    crc = crc32Table[(crc ^ buffer[index]) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function getDosDateTime(date = new Date()) {
  const year = Math.max(1980, date.getFullYear());
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = Math.floor(date.getSeconds() / 2);

  const dosTime = (hours << 11) | (minutes << 5) | seconds;
  const dosDate = ((year - 1980) << 9) | (month << 5) | day;

  return {
    dosTime,
    dosDate,
  };
}

function createLocalFileHeader(entry: ZipEntry, fileNameBuffer: Buffer) {
  const header = Buffer.alloc(30);

  header.writeUInt32LE(0x04034b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(0, 6);
  header.writeUInt16LE(0, 8);
  header.writeUInt16LE(entry.dosTime, 10);
  header.writeUInt16LE(entry.dosDate, 12);
  header.writeUInt32LE(entry.crc32, 14);
  header.writeUInt32LE(entry.compressedSize, 18);
  header.writeUInt32LE(entry.uncompressedSize, 22);
  header.writeUInt16LE(fileNameBuffer.length, 26);
  header.writeUInt16LE(0, 28);

  return header;
}

function createCentralDirectoryHeader(entry: ZipEntry, fileNameBuffer: Buffer) {
  const header = Buffer.alloc(46);

  header.writeUInt32LE(0x02014b50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(20, 6);
  header.writeUInt16LE(0, 8);
  header.writeUInt16LE(0, 10);
  header.writeUInt16LE(entry.dosTime, 12);
  header.writeUInt16LE(entry.dosDate, 14);
  header.writeUInt32LE(entry.crc32, 16);
  header.writeUInt32LE(entry.compressedSize, 20);
  header.writeUInt32LE(entry.uncompressedSize, 24);
  header.writeUInt16LE(fileNameBuffer.length, 28);
  header.writeUInt16LE(0, 30);
  header.writeUInt16LE(0, 32);
  header.writeUInt16LE(0, 34);
  header.writeUInt16LE(0, 36);
  header.writeUInt32LE(0, 38);
  header.writeUInt32LE(entry.localHeaderOffset, 42);

  return header;
}

function createEndOfCentralDirectory(params: {
  entryCount: number;
  centralDirectorySize: number;
  centralDirectoryOffset: number;
}) {
  const header = Buffer.alloc(22);

  header.writeUInt32LE(0x06054b50, 0);
  header.writeUInt16LE(0, 4);
  header.writeUInt16LE(0, 6);
  header.writeUInt16LE(params.entryCount, 8);
  header.writeUInt16LE(params.entryCount, 10);
  header.writeUInt32LE(params.centralDirectorySize, 12);
  header.writeUInt32LE(params.centralDirectoryOffset, 16);
  header.writeUInt16LE(0, 20);

  return header;
}

function sanitizeFileName(fileName: string) {
  return fileName
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, "_")
    .slice(0, 120);
}

function getSafeImageFileName(file: File, index: number) {
  const originalName = sanitizeFileName(file.name || `photo-${index + 1}`);
  const hasExtension = /\.[a-z0-9]+$/i.test(originalName);

  if (hasExtension) {
    return `${String(index + 1).padStart(2, "0")}_${originalName}`;
  }

  const extension = file.type.split("/")[1] || "jpg";
  return `${String(index + 1).padStart(2, "0")}_${originalName}.${extension}`;
}

function formatDateForFileName(value?: string) {
  if (!value) {
    return "reservation";
  }

  return value.replace(/[^\d]/g, "").slice(0, 8) || "reservation";
}

async function fileToBuffer(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function createZipBuffer(
  files: File[],
  reservationName: string,
  reservationDate?: string
) {
  const localParts: Buffer[] = [];
  const centralDirectoryParts: Buffer[] = [];
  const entries: ZipEntry[] = [];

  let offset = 0;

  async function addFileToZip(fileName: string, buffer: Buffer) {
    const fileNameBuffer = Buffer.from(fileName, "utf8");
    const { dosTime, dosDate } = getDosDateTime();

    const entry: ZipEntry = {
      name: fileName,
      buffer,
      crc32: getCrc32(buffer),
      compressedSize: buffer.length,
      uncompressedSize: buffer.length,
      localHeaderOffset: offset,
      dosTime,
      dosDate,
    };

    const localHeader = createLocalFileHeader(entry, fileNameBuffer);

    localParts.push(localHeader, fileNameBuffer, buffer);

    offset += localHeader.length + fileNameBuffer.length + buffer.length;

    entries.push(entry);
  }

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const buffer = await fileToBuffer(file);
    const fileName = getSafeImageFileName(file, index);

    await addFileToZip(fileName, buffer);
  }

  const readme = [
    "SUNG SAN SCUBA Dive Center",
    "",
    `고객명: ${reservationName}`,
    `예약일: ${reservationDate || "-"}`,
    "",
    "첨부된 사진은 고객님의 체험/다이빙 사진입니다.",
  ].join("\n");

  await addFileToZip("README.txt", Buffer.from(readme, "utf8"));

  const centralDirectoryOffset = offset;

  for (const entry of entries) {
    const fileNameBuffer = Buffer.from(entry.name, "utf8");
    const centralDirectoryHeader = createCentralDirectoryHeader(
      entry,
      fileNameBuffer
    );

    centralDirectoryParts.push(centralDirectoryHeader, fileNameBuffer);
  }

  const centralDirectorySize = centralDirectoryParts.reduce(
    (sum, part) => sum + part.length,
    0
  );

  const endOfCentralDirectory = createEndOfCentralDirectory({
    entryCount: entries.length,
    centralDirectorySize,
    centralDirectoryOffset,
  });

  return Buffer.concat([
    ...localParts,
    ...centralDirectoryParts,
    endOfCentralDirectory,
  ]);
}

function createSesClient() {
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;

  if (!region) {
    throw new Error("AWS_REGION 환경변수가 설정되지 않았습니다.");
  }

  return new SESClient({
    region,
  });
}

function encodeMimeSubject(subject: string) {
  return `=?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=`;
}

function encodeAttachmentFileName(fileName: string) {
  return `=?UTF-8?B?${Buffer.from(fileName, "utf8").toString("base64")}?=`;
}

function toBase64Lines(bufferOrText: Buffer | string) {
  const base64 = Buffer.isBuffer(bufferOrText)
    ? bufferOrText.toString("base64")
    : Buffer.from(bufferOrText, "utf8").toString("base64");

  return base64.replace(/.{1,76}/g, "$&\r\n").trimEnd();
}

function createRawEmail(params: {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  zipBuffer: Buffer;
  zipFileName: string;
}) {
  const mixedBoundary = `mixed_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2)}`;
  const alternativeBoundary = `alternative_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2)}`;

  const encodedSubject = encodeMimeSubject(params.subject);
  const encodedZipFileName = encodeAttachmentFileName(params.zipFileName);

  const rawMessage = [
    `From: ${params.from}`,
    `To: ${params.to}`,
    `Subject: ${encodedSubject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${mixedBoundary}"`,
    "",
    `--${mixedBoundary}`,
    `Content-Type: multipart/alternative; boundary="${alternativeBoundary}"`,
    "",
    `--${alternativeBoundary}`,
    `Content-Type: text/plain; charset="UTF-8"`,
    "Content-Transfer-Encoding: base64",
    "",
    toBase64Lines(params.text),
    "",
    `--${alternativeBoundary}`,
    `Content-Type: text/html; charset="UTF-8"`,
    "Content-Transfer-Encoding: base64",
    "",
    toBase64Lines(params.html),
    "",
    `--${alternativeBoundary}--`,
    "",
    `--${mixedBoundary}`,
    `Content-Type: application/zip; name="${encodedZipFileName}"`,
    `Content-Disposition: attachment; filename="${encodedZipFileName}"`,
    "Content-Transfer-Encoding: base64",
    "",
    toBase64Lines(params.zipBuffer),
    "",
    `--${mixedBoundary}--`,
    "",
  ].join("\r\n");

  return Buffer.from(rawMessage, "utf8");
}

async function sendPhotoZipEmail(params: {
  to: string;
  customerName: string;
  reservationDate?: string;
  zipBuffer: Buffer;
  zipFileName: string;
}) {
  const fromEmail = process.env.SES_FROM_EMAIL;

  if (!fromEmail) {
    throw new Error("SES_FROM_EMAIL 환경변수가 설정되지 않았습니다.");
  }

  const sesClient = createSesClient();

  const subject = `[SUNG SAN SCUBA] ${params.customerName}님 사진을 보내드립니다.`;

  const text = [
    `${params.customerName}님, 안녕하세요.`,
    "",
    "SUNG SAN SCUBA Dive Center입니다.",
    "체험/다이빙 사진을 ZIP 파일로 첨부해드립니다.",
    "",
    params.reservationDate ? `예약일: ${params.reservationDate}` : "",
    "",
    "소중한 추억으로 간직해 주세요.",
    "",
    "감사합니다.",
    "SUNG SAN SCUBA Dive Center",
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #0f172a;">
      <h2 style="margin: 0 0 16px; color: #0369a1;">SUNG SAN SCUBA Dive Center</h2>
      <p>${params.customerName}님, 안녕하세요.</p>
      <p>체험/다이빙 사진을 ZIP 파일로 첨부해드립니다.</p>
      ${
        params.reservationDate
          ? `<p><strong>예약일:</strong> ${params.reservationDate}</p>`
          : ""
      }
      <p>소중한 추억으로 간직해 주세요.</p>
      <p style="margin-top: 24px;">감사합니다.<br />SUNG SAN SCUBA Dive Center</p>
    </div>
  `;

  const rawEmail = createRawEmail({
    from: fromEmail,
    to: params.to,
    subject,
    text,
    html,
    zipBuffer: params.zipBuffer,
    zipFileName: params.zipFileName,
  });

  await sesClient.send(
    new SendRawEmailCommand({
      Source: fromEmail,
      Destinations: [params.to],
      RawMessage: {
        Data: rawEmail,
      },
    })
  );
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const reservation = await reservationRepository.findById(id);

    if (!reservation) {
      return NextResponse.json(
        {
          ok: false,
          message: "예약 정보를 찾을 수 없습니다.",
        },
        {
          status: 404,
        }
      );
    }

    if (reservation.status !== "COMPLETED") {
      return NextResponse.json(
        {
          ok: false,
          message: "완료 처리된 예약만 사진을 발송할 수 있습니다.",
        },
        {
          status: 400,
        }
      );
    }

    if (!reservation.email) {
      return NextResponse.json(
        {
          ok: false,
          message: "고객 이메일이 없어 사진을 발송할 수 없습니다.",
        },
        {
          status: 400,
        }
      );
    }

    const formData = await request.formData();
    const photos = formData.getAll("photos");

    if (photos.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          message: "발송할 사진을 선택해 주세요.",
        },
        {
          status: 400,
        }
      );
    }

    const files: File[] = [];
    let totalSize = 0;

    for (const item of photos) {
      if (!(item instanceof File)) {
        continue;
      }

      if (item.size <= 0) {
        continue;
      }

      if (!allowedImageTypes.has(item.type)) {
        return NextResponse.json(
          {
            ok: false,
            message: "jpg, png, webp, gif, heic 이미지만 업로드할 수 있습니다.",
          },
          {
            status: 400,
          }
        );
      }

      totalSize += item.size;

      if (totalSize > MAX_TOTAL_FILE_SIZE) {
        return NextResponse.json(
          {
            ok: false,
            message: "사진 총 용량은 25MB를 넘을 수 없습니다.",
          },
          {
            status: 400,
          }
        );
      }

      files.push(item);
    }

    if (files.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          message: "발송할 사진 파일이 없습니다.",
        },
        {
          status: 400,
        }
      );
    }

    const reservationDateForFileName = formatDateForFileName(
      reservation.reservationDate
    );

    const safeCustomerName = sanitizeFileName(reservation.name || "customer");

    const zipFileName = `sungsan-scuba-${reservationDateForFileName}-${safeCustomerName}-photos.zip`;

    const zipBuffer = await createZipBuffer(
      files,
      reservation.name,
      reservation.reservationDate
    );

    await sendPhotoZipEmail({
      to: reservation.email,
      customerName: reservation.name,
      reservationDate: reservation.reservationDate,
      zipBuffer,
      zipFileName,
    });

    return NextResponse.json({
      ok: true,
      message: "사진 ZIP 메일을 발송했습니다.",
    });
  } catch (error) {
    console.error("[SEND_PHOTOS_ERROR]", error);

    const message =
      error instanceof Error
        ? error.message
        : "사진 메일 발송 중 오류가 발생했습니다.";

    return NextResponse.json(
      {
        ok: false,
        message,
      },
      {
        status: 500,
      }
    );
  }
}