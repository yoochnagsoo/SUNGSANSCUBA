export function normalizePhoneDigits(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\D/g, "");
}

export function isValidKoreanMobilePhone(value: unknown) {
  const digits = normalizePhoneDigits(value);

  return /^010\d{8}$/.test(digits);
}

export function formatKoreanMobilePhone(value: unknown) {
  const digits = normalizePhoneDigits(value);

  if (!/^010\d{8}$/.test(digits)) {
    return "";
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export function formatPhoneInput(value: string) {
  const digits = normalizePhoneDigits(value).slice(0, 11);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}