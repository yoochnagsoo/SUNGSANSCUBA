import { MemoryGalleryRepository } from "./memoryGalleryRepository";
import type { GalleryRepository } from "./types";

const repository: GalleryRepository = new MemoryGalleryRepository();

export const galleryRepository = repository;