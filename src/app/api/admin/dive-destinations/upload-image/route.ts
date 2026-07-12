import { randomUUID } from "crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? "ap-northeast-2",
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
  const extension = fileName.split(".").pop()?.toLowerCase().trim();

  if (!extension) {
    return "";
  }

  return extension;
}

function isAllowedImage(fileName: string, contentType: string) {
  const extension = getExtension(fileName);

  if (allowedImageTypes.has(contentType)) {
    return true;
  }

  if (allowedImageExtensions.has(extension)) {
    return true;
  }

  return false;
}

function getSafeContentType(fileName: string, contentType: string) {
  const extension = getExtension(fileName);

  if (allowedImageTypes.has(contentType)) {
    if (contentType === "image/jpg") {
      return "image/jpeg";
    }

    return contentType;
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
        }
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
        }
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
        }
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
        }
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
        }
      );
    }

    const extension = getSafeExtension(originalFileName, originalContentType);

    if (!extension) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "이미지 확장자를 확인할 수 없습니다. JPG, PNG, WEBP, GIF, AVIF 파일만 업로드해주세요.",
        },
        {
          status: 400,
        }
      );
    }

    const contentType = getSafeContentType(originalFileName, originalContentType);

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
      })
    );

    const imageUrl = `${publicBaseUrl.replace(/\/$/, "")}/${key}`;

    return NextResponse.json({
      ok: true,
      imageUrl,
      key,
      contentType,
    });
  } catch (error) {
    console.error("[POST /api/admin/dive-destinations/upload-image]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "다이빙 포인트 이미지 업로드 중 오류가 발생했습니다.",
      },
      {
        status: 500,
      }
    );
  }
}