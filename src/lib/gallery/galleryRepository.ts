import { DynamoGalleryRepository } from "./dynamoGalleryRepository";
import { MemoryGalleryRepository } from "./memoryGalleryRepository";
import type { GalleryRepository } from "./types";

function createGalleryRepository(): GalleryRepository {
  const isProduction = process.env.NODE_ENV === "production";

  const hasDynamoDbConfig =
    Boolean(process.env.DYNAMODB_GALLERY_TABLE) &&
    Boolean(process.env.AWS_REGION);

  if (isProduction && !hasDynamoDbConfig) {
    throw new Error(
      "운영 환경에서는 DYNAMODB_GALLERY_TABLE과 AWS_REGION 환경변수가 반드시 필요합니다.",
    );
  }

  if (hasDynamoDbConfig) {
    return new DynamoGalleryRepository();
  }

  return new MemoryGalleryRepository();
}

export const galleryRepository = createGalleryRepository();