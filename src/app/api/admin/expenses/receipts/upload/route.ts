import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

import { requireAdminMenuMutation } from "@/lib/adminAuth";
import {
  s3Client,
  s3GalleryBucket,
  s3GalleryPublicBaseUrl,
} from "@/lib/aws/s3";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_IMAGE_WIDTH = 1920;
const WEBP_QUALITY = 82;

const allowedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const allowedDocumentTypes = new Set([
  "application/pdf",
]);

function getFileExtension(fileName: string) {
  const extension = fileName
    .split(".")
    .pop()
    ?.trim()
    .toLowerCase();

  return extension || "";
}

function createReceiptKey(extension: string) {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  return [
    "expenses",
    "receipts",
    year,
    month,
    `${crypto.randomUUID()}.${extension}`,
  ].join("/");
}

function normalizeFileName(fileName: string) {
  const normalized = fileName
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, " ")
    .trim();

  return normalized || "receipt";
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "알 수 없는 오류가 발생했습니다.";
}

async function optimizeImage(buffer: Buffer) {
  const image = sharp(buffer, {
    failOn: "none",
    animated: false,
  });

  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("이미지 정보를 읽을 수 없습니다.");
  }

  const shouldResize = metadata.width > MAX_IMAGE_WIDTH;

  const optimizedBuffer = await image
    .rotate()
    .resize({
      width: shouldResize
        ? MAX_IMAGE_WIDTH
        : undefined,
      withoutEnlargement: true,
    })
    .webp({
      quality: WEBP_QUALITY,
      effort: 4,
    })
    .toBuffer();

  return {
    buffer: optimizedBuffer,
    contentType: "image/webp",
    extension: "webp",
    width: metadata.width,
    height: metadata.height,
    originalFormat: metadata.format ?? "",
    originalSize: buffer.length,
    uploadedSize: optimizedBuffer.length,
  };
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminMenuMutation(request, "EXPENSES");

  if (!auth.ok) {
    return auth.response;
  }

  try {
    if (!s3GalleryBucket) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "S3_GALLERY_BUCKET 환경변수가 설정되지 않았습니다.",
        },
        {
          status: 500,
        },
      );
    }

    if (!s3GalleryPublicBaseUrl) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "S3_GALLERY_PUBLIC_BASE_URL 환경변수가 설정되지 않았습니다.",
        },
        {
          status: 500,
        },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          ok: false,
          message: "업로드할 영수증 파일이 없습니다.",
        },
        {
          status: 400,
        },
      );
    }

    const isImage = allowedImageTypes.has(file.type);
    const isPdf = allowedDocumentTypes.has(file.type);

    if (!isImage && !isPdf) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "영수증은 JPG, PNG, WEBP, GIF 또는 PDF 파일만 등록할 수 있습니다.",
        },
        {
          status: 400,
        },
      );
    }

    if (file.size <= 0) {
      return NextResponse.json(
        {
          ok: false,
          message: "빈 파일은 등록할 수 없습니다.",
        },
        {
          status: 400,
        },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "영수증 파일은 최대 20MB까지만 등록할 수 있습니다.",
        },
        {
          status: 400,
        },
      );
    }

    const originalFileName = normalizeFileName(
      file.name,
    );

    const arrayBuffer = await file.arrayBuffer();
    const originalBuffer = Buffer.from(arrayBuffer);

    let uploadBuffer: Buffer;
    let uploadContentType: string;
    let uploadExtension: string;
    let uploadedSize: number;
    let width: number | null = null;
    let height: number | null = null;
    let originalFormat = "";

    if (isImage) {
      const optimized = await optimizeImage(
        originalBuffer,
      );

      uploadBuffer = optimized.buffer;
      uploadContentType = optimized.contentType;
      uploadExtension = optimized.extension;
      uploadedSize = optimized.uploadedSize;
      width = optimized.width;
      height = optimized.height;
      originalFormat = optimized.originalFormat;
    } else {
      uploadBuffer = originalBuffer;
      uploadContentType = "application/pdf";
      uploadExtension =
        getFileExtension(originalFileName) || "pdf";
      uploadedSize = originalBuffer.length;
      originalFormat = "pdf";
    }

    const key = createReceiptKey(uploadExtension);

    await s3Client.send(
      new PutObjectCommand({
        Bucket: s3GalleryBucket,
        Key: key,
        Body: uploadBuffer,
        ContentType: uploadContentType,
        ContentDisposition: `inline; filename*=UTF-8''${encodeURIComponent(
          originalFileName,
        )}`,
        CacheControl: "private, max-age=0, no-cache",
        Metadata: {
          originalFileName: encodeURIComponent(
            originalFileName,
          ),
        },
      }),
    );

    const baseUrl =
      s3GalleryPublicBaseUrl.replace(/\/$/, "");

    const receiptUrl = `${baseUrl}/${key}`;

    return NextResponse.json({
      ok: true,

      receiptKey: key,
      receiptUrl,
      receiptFileName: originalFileName,
      receiptMimeType: uploadContentType,
      receiptSize: uploadedSize,

      originalSize: file.size,
      originalFormat,
      width,
      height,
    });
  } catch (error) {
    console.error(
      "Expense receipt upload failed:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        message: `영수증 업로드 중 오류가 발생했습니다. ${getErrorMessage(
          error,
        )}`,
      },
      {
        status: 500,
      },
    );
  }
}
