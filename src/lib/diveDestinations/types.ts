export type DiveDestinationWaterTemperature = {
  season: string;
  months: string;
  temperature: string;
};

export type DiveDestination = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrls: string[];
  depth: string;
  level: string;
  highlights: string[];
  waterTemperatures: DiveDestinationWaterTemperature[];
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type DiveDestinationInput = {
  title: string;
  subtitle: string;
  description: string;
  imageUrls: string[];
  depth: string;
  level: string;
  highlights: string[];
  waterTemperatures: DiveDestinationWaterTemperature[];
  sortOrder: number;
  isActive: boolean;
};

export type DiveDestinationRepository = {
  list: () => Promise<DiveDestination[]>;
  listActive: () => Promise<DiveDestination[]>;
  getById: (id: string) => Promise<DiveDestination | null>;
  create: (input: DiveDestinationInput) => Promise<DiveDestination>;
  update: (
    id: string,
    input: Partial<DiveDestinationInput>
  ) => Promise<DiveDestination | null>;
  delete: (id: string) => Promise<boolean>;
};