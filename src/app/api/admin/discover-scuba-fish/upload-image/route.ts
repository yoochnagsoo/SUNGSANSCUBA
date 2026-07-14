import { randomUUID } from "crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? "ap-northeast-2",
});

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

function getExtension(fileName: string) {
  return fileName.split(".").pop()?.toLowerCase().trim() ?? "";
}

function isAllowedImage(fileName: string, contentType: string) {
  const extension = getExtension(fileName);

  return allowedImageTypes.has(contentType) || allowedImageExtensions.has(extension);
}

function getSafeContentType(fileName: string, contentType: string) {
  if (allowedImageTypes.has(contentType)) {
    return contentType === "image/jpg" ? "image/jpeg" : contentType;
  }

  return contentTypeByExtension[getExtension(fileName)] ?? "image/jpeg";
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
    const bucket = process.env.S3_GALLERY_BUCKET;
    const publicBaseUrl = process.env.S3_GALLERY_PUBLIC_BASE_URL;

    if (!bucket) {
      return NextResponse.json(
        {
          ok: false,
          message: "S3_GALLERY_BUCKET 환경변수가 설정되지 않았습니다.",
        },
        {
          status: 500,
        },
      );
    }

    if (!publicBaseUrl) {
      return NextResponse.json(
        {
          ok: false,
          message: "S3_GALLERY_PUBLIC_BASE_URL 환경변수가 설정되지 않았습니다.",
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
          message: "업로드할 이미지 파일이 없습니다.",
        },
        {
          status: 400,
        },
      );
    }

    if (!isAllowedImage(file.name, file.type)) {
      return NextResponse.json(
        {
          ok: false,
          message: "JPG, PNG, WEBP, GIF, AVIF 이미지만 업로드할 수 있습니다.",
        },
        {
          status: 400,
        },
      );
    }

    if (file.size > 10 * 1024 * 1024) {
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

    const extension = getSafeExtension(file.name, file.type);

    if (!extension) {
      return NextResponse.json(
        {
          ok: false,
          message: "이미지 확장자를 확인할 수 없습니다.",
        },
        {
          status: 400,
        },
      );
    }

    const contentType = getSafeContentType(file.name, file.type);
    const key = `discover-scuba-fish/${new Date()
      .toISOString()
      .slice(0, 10)}/${randomUUID()}.${extension}`;

    const arrayBuffer = await file.arrayBuffer();

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: Buffer.from(arrayBuffer),
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );

    return NextResponse.json({
      ok: true,
      imageUrl: `${publicBaseUrl.replace(/\/$/, "")}/${key}`,
      key,
      contentType,
    });
  } catch (error) {
    console.error("[POST /api/admin/discover-scuba-fish/upload-image]", error);

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "체험 바다 생물 이미지 업로드 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      },
    );
  }
}
