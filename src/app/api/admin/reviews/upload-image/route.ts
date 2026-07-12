import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

import { requireAdminMenuMutation } from "@/lib/adminAuth";

export const runtime = "nodejs";

const allowedImageTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function createS3Client() {
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;

  if (!region) {
    throw new Error("AWS_REGION 환경변수가 설정되지 않았습니다.");
  }

  return new S3Client({
    region,
  });
}

function getBucketName() {
  const bucketName =
    process.env.S3_GALLERY_BUCKET ||
    process.env.S3_BUCKET_NAME ||
    process.env.AWS_S3_BUCKET;

  if (!bucketName) {
    throw new Error("S3_GALLERY_BUCKET 환경변수가 설정되지 않았습니다.");
  }

  return bucketName;
}

function getPublicBaseUrl() {
  const publicBaseUrl =
    process.env.S3_GALLERY_PUBLIC_BASE_URL ||
    process.env.S3_PUBLIC_BASE_URL ||
    process.env.CLOUDFRONT_URL;

  if (!publicBaseUrl) {
    throw new Error("S3_GALLERY_PUBLIC_BASE_URL 환경변수가 설정되지 않았습니다.");
  }

  return publicBaseUrl.replace(/\/+$/, "");
}

function sanitizeFileName(fileName: string) {
  return fileName
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/[^\w.\-가-힣]/g, "_")
    .slice(0, 120);
}

function getExtension(file: File) {
  const fileNameExtension = file.name.split(".").pop()?.toLowerCase();

  if (fileNameExtension) {
    return fileNameExtension;
  }

  if (file.type === "image/jpeg") {
    return "jpg";
  }

  if (file.type === "image/png") {
    return "png";
  }

  if (file.type === "image/webp") {
    return "webp";
  }

  if (file.type === "image/gif") {
    return "gif";
  }

  if (file.type === "image/heic") {
    return "heic";
  }

  if (file.type === "image/heif") {
    return "heif";
  }

  return "jpg";
}

function createS3Key(file: File) {
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  const safeName = sanitizeFileName(file.name || "review-image");
  const extension = getExtension(file);
  const randomId = crypto.randomUUID();

  if (safeName.includes(".")) {
    return `reviews/${yyyy}/${mm}/${dd}/${randomId}-${safeName}`;
  }

  return `reviews/${yyyy}/${mm}/${dd}/${randomId}-${safeName}.${extension}`;
}

async function fileToBuffer(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function jsonResponse(
  body: {
    ok: boolean;
    message: string;
    images?: {
      key: string;
      url: string;
      fileName: string;
      size: number;
      type: string;
    }[];
  },
  status = 200
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminMenuMutation(request, "REVIEWS");

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll("images");

    if (files.length === 0) {
      return jsonResponse(
        {
          ok: false,
          message: "업로드할 이미지를 선택해 주세요.",
        },
        400
      );
    }

    const s3Client = createS3Client();
    const bucketName = getBucketName();
    const publicBaseUrl = getPublicBaseUrl();

    const uploadedImages: {
      key: string;
      url: string;
      fileName: string;
      size: number;
      type: string;
    }[] = [];

    for (const item of files) {
      if (!(item instanceof File)) {
        continue;
      }

      if (item.size <= 0) {
        continue;
      }

      if (item.size > MAX_FILE_SIZE) {
        return jsonResponse(
          {
            ok: false,
            message: "이미지 1개당 최대 10MB까지 업로드할 수 있습니다.",
          },
          400
        );
      }

      if (!allowedImageTypes.has(item.type)) {
        return jsonResponse(
          {
            ok: false,
            message: "jpg, png, webp, gif, heic 이미지만 업로드할 수 있습니다.",
          },
          400
        );
      }

      const buffer = await fileToBuffer(item);
      const key = createS3Key(item);

      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: key,
          Body: buffer,
          ContentType: item.type,
          CacheControl: "public, max-age=31536000, immutable",
        })
      );

      uploadedImages.push({
        key,
        url: `${publicBaseUrl}/${key}`,
        fileName: item.name,
        size: item.size,
        type: item.type,
      });
    }

    if (uploadedImages.length === 0) {
      return jsonResponse(
        {
          ok: false,
          message: "업로드 가능한 이미지가 없습니다.",
        },
        400
      );
    }

    return jsonResponse({
      ok: true,
      message: "이미지가 업로드되었습니다.",
      images: uploadedImages,
    });
  } catch (error) {
    console.error("[ADMIN_REVIEW_IMAGE_UPLOAD_ERROR]", error);

    const message =
      error instanceof Error
        ? error.message
        : "이미지 업로드 중 오류가 발생했습니다.";

    return jsonResponse(
      {
        ok: false,
        message,
      },
      500
    );
  }
}
