import type {
  GalleryImage,
  GalleryImageInput,
  GalleryImageUpdateInput,
  GalleryRepository,
} from "./types";

const globalForGallery = globalThis as unknown as {
  __galleryImages?: GalleryImage[];
};

const galleryImages = globalForGallery.__galleryImages ?? [];

globalForGallery.__galleryImages = galleryImages;

function sortGalleryImages(images: GalleryImage[]) {
  return [...images].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }

    return b.createdAt.localeCompare(a.createdAt);
  });
}

export class MemoryGalleryRepository implements GalleryRepository {
  async listAll(): Promise<GalleryImage[]> {
    return sortGalleryImages(galleryImages);
  }

  async listVisible(): Promise<GalleryImage[]> {
    return sortGalleryImages(galleryImages.filter((image) => image.isVisible));
  }

  async getById(id: string): Promise<GalleryImage | null> {
    return galleryImages.find((image) => image.id === id) ?? null;
  }

  async create(input: GalleryImageInput): Promise<GalleryImage> {
    const now = new Date().toISOString();

    const image: GalleryImage = {
      id: crypto.randomUUID(),
      title: input.title.trim(),
      description: input.description?.trim() ?? "",
      imageUrl: input.imageUrl.trim(),
      sortOrder:
        typeof input.sortOrder === "number" && Number.isFinite(input.sortOrder)
          ? input.sortOrder
          : 999,
      isVisible: input.isVisible ?? true,
      createdAt: now,
      updatedAt: now,
    };

    galleryImages.push(image);

    return image;
  }

  async update(
    id: string,
    input: GalleryImageUpdateInput,
  ): Promise<GalleryImage | null> {
    const index = galleryImages.findIndex((image) => image.id === id);

    if (index === -1) {
      return null;
    }

    const current = galleryImages[index];

    const updated: GalleryImage = {
      ...current,
      title:
        typeof input.title === "string" ? input.title.trim() : current.title,
      description:
        typeof input.description === "string"
          ? input.description.trim()
          : current.description,
      imageUrl:
        typeof input.imageUrl === "string"
          ? input.imageUrl.trim()
          : current.imageUrl,
      sortOrder:
        typeof input.sortOrder === "number" && Number.isFinite(input.sortOrder)
          ? input.sortOrder
          : current.sortOrder,
      isVisible:
        typeof input.isVisible === "boolean"
          ? input.isVisible
          : current.isVisible,
      updatedAt: new Date().toISOString(),
    };

    galleryImages[index] = updated;

    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const index = galleryImages.findIndex((image) => image.id === id);

    if (index === -1) {
      return false;
    }

    galleryImages.splice(index, 1);

    return true;
  }
}