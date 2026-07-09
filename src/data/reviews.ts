export type ReviewItem = {
  id: string;
  userId: string;
  program: string;
  comment: string;
  images: string[];
};

export const reviewItems: ReviewItem[] = [
  {
    id: "review-01",
    userId: "n****",
    program: "체험다이빙",
    comment:
      "처음이라 긴장했는데 설명을 차분하게 잘해주셔서 편하게 체험할 수 있었어요. 물속 사진도 너무 예쁘게 남겨주셔서 좋은 추억이 됐습니다.",
    images: [
      "/images/reviews/review-01-01.jpg",
      "/images/reviews/review-01-02.jpg",
      "/images/reviews/review-01-03.jpg",
    ],
  },
  {
    id: "review-02",
    userId: "j****",
    program: "보트다이빙",
    comment:
      "성산 바다가 정말 깨끗했고 포인트도 좋았습니다. 장비 상태도 깔끔하고 진행도 안전하게 해주셔서 만족스러웠습니다.",
    images: [
      "/images/reviews/review-02-01.jpg",
      "/images/reviews/review-02-02.jpg",
    ],
  },
  {
    id: "review-03",
    userId: "s****",
    program: "스노클링",
    comment:
      "가족이랑 같이 갔는데 아이들도 무서워하지 않게 잘 챙겨주셨어요. 사진을 여러 장 남겨주셔서 여행 기록으로 너무 좋았습니다.",
    images: [
      "/images/reviews/review-03-01.jpg",
      "/images/reviews/review-03-02.jpg",
      "/images/reviews/review-03-03.jpg",
      "/images/reviews/review-03-04.jpg",
    ],
  },
];

export const naverReviewUrl =
  "https://map.naver.com/p/search/%EC%84%B1%EC%82%B0%EC%8A%A4%EC%BF%A0%EB%B2%84/place/32278847?placePath=%2Freview%3FabtExp%3DNEW-PLACE-SEARCH%3A2%26bk_query%3D%EC%84%B1%EC%82%B0%EC%8A%A4%EC%BF%A0%EB%B2%84%26entry%3Dpll%26fromNxList%3Dtrue%26fromPanelNum%3D2%26locale%3Dko%26searchText%3D%EC%84%B1%EC%82%B0%EC%8A%A4%EC%BF%A0%EB%B2%84%26svcName%3Dmap_pcv5%26timestamp%3D202607091423&bk_query=%EC%84%B1%EC%82%B0%EC%8A%A4%EC%BF%A0%EB%B2%84&entry=pll&from=nx&fromNxList=true&searchType=place&c=15.00,0,0,2,dh";