export type GalleryImage = {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GalleryImageInput = {
  title: string;
  description?: string;
  imageUrl: string;
  sortOrder?: number;
  isVisible?: boolean;
};

export type GalleryImageUpdateInput = Partial<GalleryImageInput>;

export interface GalleryRepository {
  listAll(): Promise<GalleryImage[]>;
  listVisible(): Promise<GalleryImage[]>;
  getById(id: string): Promise<GalleryImage | null>;
  create(input: GalleryImageInput): Promise<GalleryImage>;
  update(id: string, input: GalleryImageUpdateInput): Promise<GalleryImage | null>;
  delete(id: string): Promise<boolean>;
}