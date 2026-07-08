export const PROGRAM_OPTIONS = [
  {
    label: "체험 다이빙 1:4",
    value: "체험 다이빙 1:4",
    legacyValues: ["Discover Scuba Diving", "Discover Scuba", "체험 다이빙"],
    shortDescription:
      "강사 1명에 체험객 최대 4명이 함께 진행하는 기본 체험 다이빙",
    duration: "약 1~2시간",
    recommendedFor: "일반 여행객 / 친구 / 가족 / 단체",
    price: "69,000원",
    priceDescription: "1인 기준",
    maxGuestsPerInstructor: 4,
  },
  {
    label: "체험 다이빙 1:2",
    value: "체험 다이빙 1:2",
    legacyValues: ["프리미엄 체험 다이빙", "커플 체험 다이빙", "키즈 체험 다이빙"],
    shortDescription:
      "강사 1명에 체험객 최대 2명으로 더 여유 있게 진행하는 체험 다이빙",
    duration: "약 1~2시간",
    recommendedFor: "아이 동반 / 커플 / 더 세심한 케어가 필요한 분",
    price: "99,000원",
    priceDescription: "1인 기준",
    maxGuestsPerInstructor: 2,
  },
  {
    label: "펀 다이빙",
    value: "펀 다이빙",
    legacyValues: ["Fun Diving"],
    shortDescription: "자격증 보유자를 위한 제주 성산 바다 다이빙",
    duration: "일정 협의",
    recommendedFor: "자격증 보유 다이버",
    price: "문의",
    priceDescription: "포인트와 일정에 따라 협의",
    maxGuestsPerInstructor: undefined,
  },
  {
    label: "오픈워터 코스",
    value: "오픈워터 코스",
    legacyValues: ["Open Water Course", "Open Water"],
    shortDescription: "스쿠버다이빙 입문 자격증 취득 과정",
    duration: "일정 협의",
    recommendedFor: "자격증 취득 희망자",
    price: "문의",
    priceDescription: "교육 일정에 따라 협의",
    maxGuestsPerInstructor: undefined,
  },
  {
    label: "어드밴스드 코스",
    value: "어드밴스드 코스",
    legacyValues: ["Advanced Course", "Advanced"],
    shortDescription: "다이빙 경험을 확장하는 심화 교육 과정",
    duration: "일정 협의",
    recommendedFor: "오픈워터 이상 보유자",
    price: "문의",
    priceDescription: "교육 일정에 따라 협의",
    maxGuestsPerInstructor: undefined,
  },
];

export function normalizeProgramValue(value?: string) {
  const program = String(value || "").trim();

  if (!program) {
    return PROGRAM_OPTIONS[0].value;
  }

  const matched = PROGRAM_OPTIONS.find((item) => {
    return item.value === program || item.legacyValues.includes(program);
  });

  return matched?.value || program;
}

export function getProgramLabel(value?: string) {
  const normalizedValue = normalizeProgramValue(value);

  return (
    PROGRAM_OPTIONS.find((program) => program.value === normalizedValue)
      ?.label || normalizedValue
  );
}

export function getProgramOption(value?: string) {
  const normalizedValue = normalizeProgramValue(value);

  return (
    PROGRAM_OPTIONS.find((program) => program.value === normalizedValue) ||
    PROGRAM_OPTIONS[0]
  );
}