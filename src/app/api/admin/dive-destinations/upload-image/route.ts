import { randomUUID } from "crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const allowedImageTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

const allowedImageExtensions = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "avif",
]);

const contentTypeByExtension: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
};

function createS3Client() {
  return new S3Client({
    region:
      process.env.AWS_REGION ||
      process.env.AWS_DEFAULT_REGION ||
      "ap-northeast-2",
  });
}

function getBucketName() {
  const bucketName =
    process.env.S3_GALLERY_BUCKET ||
    process.env.S3_BUCKET_NAME ||
    process.env.AWS_S3_BUCKET;

  if (!bucketName) {
    throw new Error("S3 버킷 환경변수가 설정되지 않았습니다.");
  }

  return bucketName;
}

function getPublicBaseUrl() {
  const publicBaseUrl =
    process.env.S3_GALLERY_PUBLIC_BASE_URL ||
    process.env.S3_PUBLIC_BASE_URL ||
    process.env.CLOUDFRONT_URL;

  if (!publicBaseUrl) {
    throw new Error("S3 공개 URL 환경변수가 설정되지 않았습니다.");
  }

  return publicBaseUrl.replace(/\/+$/, "");
}

function getExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase().trim() ?? "";
}

function isAllowedImage(fileName: string, contentType: string) {
  const extension = getExtension(fileName);

  return (
    allowedImageTypes.has(contentType) ||
    allowedImageExtensions.has(extension)
  );
}

function getSafeContentType(fileName: string, contentType: string) {
  const extension = getExtension(fileName);

  if (allowedImageTypes.has(contentType)) {
    return contentType === "image/jpg" ? "image/jpeg" : contentType;
  }

  return contentTypeByExtension[extension] ?? "image/jpeg";
}

function getSafeExtension(fileName: string, contentType: string) {
  const extension = getExtension(fileName);

  if (allowedImageExtensions.has(extension)) {
    return extension === "jpeg" ? "jpg" : extension;
  }

  if (contentType === "image/jpeg" || contentType === "image/jpg") {
    return "jpg";
  }

  if (contentType === "image/png") {
    return "png";
  }

  if (contentType === "image/webp") {
    return "webp";
  }

  if (contentType === "image/gif") {
    return "gif";
  }

  if (contentType === "image/avif") {
    return "avif";
  }

  return "";
}

export async function POST(request: NextRequest) {
  try {
    const s3 = createS3Client();
    const bucket = getBucketName();
    const publicBaseUrl = getPublicBaseUrl();

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          ok: false,
          message: "업로드할 이미지 파일이 없습니다.",
        },
        {
          status: 400,
        },
      );
    }

    const originalFileName = file.name;
    const originalContentType = file.type;

    if (!isAllowedImage(originalFileName, originalContentType)) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "JPG, PNG, WEBP, GIF, AVIF 이미지만 업로드할 수 있습니다. HEIC/HEIF 파일은 JPG로 변환 후 업로드해주세요.",
          debug: {
            fileName: originalFileName,
            contentType: originalContentType || "unknown",
          },
        },
        {
          status: 400,
        },
      );
    }

    const maxFileSize = 10 * 1024 * 1024;

    if (file.size > maxFileSize) {
      return NextResponse.json(
        {
          ok: false,
          message: "이미지 파일은 10MB 이하만 업로드할 수 있습니다.",
        },
        {
          status: 400,
        },
      );
    }

    const extension = getSafeExtension(
      originalFileName,
      originalContentType,
    );

    if (!extension) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "이미지 확장자를 확인할 수 없습니다. JPG, PNG, WEBP, GIF, AVIF 파일만 업로드해주세요.",
        },
        {
          status: 400,
        },
      );
    }

    const contentType = getSafeContentType(
      originalFileName,
      originalContentType,
    );

    const key = `dive-destinations/${new Date()
      .toISOString()
      .slice(0, 10)}/${randomUUID()}.${extension}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );

    return NextResponse.json({
      ok: true,
      imageUrl: `${publicBaseUrl}/${key}`,
      key,
      contentType,
    });
  } catch (error) {
    console.error("[POST /api/admin/dive-destinations/upload-image]", error);

    const message =
      error instanceof Error
        ? error.message
        : "다이빙 포인트 이미지 업로드 중 오류가 발생했습니다.";

    return NextResponse.json(
      {
        ok: false,
        message,
      },
      {
        status: 500,
      },
    );
  }
}
