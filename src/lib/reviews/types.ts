export type Review = {
  id: string;
  userId: string;
  program: string;
  comment: string;
  images: string[];
  isVisible: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type ReviewInput = {
  userId: string;
  program: string;
  comment: string;
  images: string[];
  isVisible: boolean;
  sortOrder: number;
};