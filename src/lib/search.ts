export function normalizeSearchText(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

export function normalizePhoneNumber(value: unknown) {
  return String(value ?? "").replace(/[^0-9]/g, "");
}

export function includesSearchText(
  value: unknown,
  normalizedKeyword: string,
) {
  if (!normalizedKeyword) {
    return true;
  }

  return normalizeSearchText(value).includes(normalizedKeyword);
}

export function includesPhoneNumber(
  value: unknown,
  normalizedPhoneKeyword: string,
) {
  if (!normalizedPhoneKeyword) {
    return false;
  }

  return normalizePhoneNumber(value).includes(normalizedPhoneKeyword);
}

export function matchesSearchValues(
  values: unknown[],
  keyword: unknown,
) {
  const normalizedKeyword = normalizeSearchText(keyword);

  if (!normalizedKeyword) {
    return true;
  }

  return values.some((value) =>
    includesSearchText(value, normalizedKeyword),
  );
}