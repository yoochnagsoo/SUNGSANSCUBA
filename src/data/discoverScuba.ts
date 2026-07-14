export type DepthStage = {
  depth: string;
  title: string;
  description: string;
};

export type DiscoverScubaFish = {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
};

export const discoverScubaDepthStages: DepthStage[] = [
  {
    depth: "0m",
    title: "입수 전 적응",
    description:
      "장비 착용, 호흡기 사용법, 수신호를 충분히 익히고 얕은 곳에서 천천히 물에 적응합니다.",
  },
  {
    depth: "1~2m",
    title: "호흡과 부력 감각",
    description:
      "강사와 함께 머무르며 천천히 호흡하고, 몸이 물에 뜨는 감각을 익히는 구간입니다.",
  },
  {
    depth: "3~5m",
    title: "성산 바다 체험",
    description:
      "컨디션과 해상 상황이 좋을 때 최대 5m 이내에서 물고기와 성산 바다 풍경을 만납니다.",
  },
];

export const discoverScubaFish: DiscoverScubaFish[] = [
  {
    id: "chromis",
    name: "자리돔",
    description:
      "성산 연안에서 자주 만나는 작은 무리 물고기입니다. 얕은 수심에서도 움직임을 관찰하기 좋습니다.",
    sortOrder: 10,
    isActive: true,
  },
  {
    id: "damselfish",
    name: "노랑자리돔",
    description:
      "밝은 색감이 눈에 잘 띄는 어종으로, 처음 바다를 만나는 체험자에게 인상적인 장면을 만들어줍니다.",
    sortOrder: 20,
    isActive: true,
  },
  {
    id: "wrasse",
    name: "놀래기",
    description:
      "바위와 해조류 주변을 오가며 먹이를 찾는 물고기입니다. 성산 바다의 자연스러운 움직임을 보여줍니다.",
    sortOrder: 30,
    isActive: true,
  },
  {
    id: "rockfish",
    name: "볼락류",
    description:
      "암반 지형 근처에서 볼 수 있는 어종입니다. 당일 수온과 시야에 따라 만날 수 있는 생물이 달라집니다.",
    sortOrder: 40,
    isActive: true,
  },
];
