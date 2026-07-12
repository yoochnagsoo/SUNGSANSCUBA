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

function createGalleryKey() {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  return `gallery/${year}/${month}/${crypto.randomUUID()}.webp`;
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
  });

  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("이미지 정보를 읽을 수 없습니다.");
  }

  const shouldResize = metadata.width > MAX_IMAGE_WIDTH;

  const optimizedBuffer = await image
    .rotate()
    .resize({
      width: shouldResize ? MAX_IMAGE_WIDTH : undefined,
      withoutEnlargement: true,
    })
    .webp({
      quality: WEBP_QUALITY,
      effort: 4,
    })
    .toBuffer();

  return {
    buffer: optimizedBuffer,
    width: metadata.width,
    height: metadata.height,
    originalFormat: metadata.format,
    originalSize: buffer.length,
    optimizedSize: optimizedBuffer.length,
  };
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminMenuMutation(request, "GALLERY");

  if (!auth.ok) {
    return auth.response;
  }

  try {
    if (!s3GalleryBucket) {
      return NextResponse.json(
        {
          ok: false,
          message: "S3_GALLERY_BUCKET 환경변수가 설정되지 않았습니다.",
        },
        { status: 500 },
      );
    }

    if (!s3GalleryPublicBaseUrl) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "S3_GALLERY_PUBLIC_BASE_URL 환경변수가 설정되지 않았습니다.",
        },
        { status: 500 },
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
        { status: 400 },
      );
    }

    if (!allowedImageTypes.has(file.type)) {
      return NextResponse.json(
        {
          ok: false,
          message: `지원하지 않는 이미지 형식입니다. 현재 형식: ${
            file.type || "unknown"
          }`,
        },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          ok: false,
          message: "이미지는 최대 20MB까지만 업로드할 수 있습니다.",
        },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const originalBuffer = Buffer.from(arrayBuffer);
    const optimized = await optimizeImage(originalBuffer);

    const key = createGalleryKey();

    await s3Client.send(
      new PutObjectCommand({
        Bucket: s3GalleryBucket,
        Key: key,
        Body: optimized.buffer,
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );

    const baseUrl = s3GalleryPublicBaseUrl.replace(/\/$/, "");
    const imageUrl = `${baseUrl}/${key}`;

    return NextResponse.json({
      ok: true,
      key,
      imageUrl,
      url: imageUrl,
      originalSize: optimized.originalSize,
      optimizedSize: optimized.optimizedSize,
      originalFormat: optimized.originalFormat,
      width: optimized.width,
      height: optimized.height,
    });
  } catch (error) {
    console.error("Gallery image upload failed:", error);

    return NextResponse.json(
      {
        ok: false,
        message: `이미지 업로드 중 오류가 발생했습니다. ${getErrorMessage(
          error,
        )}`,
      },
      { status: 500 },
    );
  }
}
