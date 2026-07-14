export type DiscoverScubaFish = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DiscoverScubaFishInput = {
  name: string;
  description: string;
  imageUrl: string;
  sortOrder: number;
  isActive: boolean;
};

export type DiscoverScubaFishRepository = {
  list: () => Promise<DiscoverScubaFish[]>;
  listActive: () => Promise<DiscoverScubaFish[]>;
  getById: (id: string) => Promise<DiscoverScubaFish | null>;
  create: (input: DiscoverScubaFishInput) => Promise<DiscoverScubaFish>;
  update: (
    id: string,
    input: Partial<DiscoverScubaFishInput>,
  ) => Promise<DiscoverScubaFish | null>;
  delete: (id: string) => Promise<boolean>;
};
