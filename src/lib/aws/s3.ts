import { S3Client } from "@aws-sdk/client-s3";

const region = process.env.AWS_REGION;

if (!region) {
  throw new Error("AWS_REGION 환경변수가 설정되지 않았습니다.");
}

export const s3Client = new S3Client({
  region,
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
});

export const s3GalleryBucket = process.env.S3_GALLERY_BUCKET;

export const s3GalleryPublicBaseUrl =
  process.env.S3_GALLERY_PUBLIC_BASE_URL;