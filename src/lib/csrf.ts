import { NextRequest, NextResponse } from "next/server";

const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

function normalizeOrigin(value: string | null) {
  if (!value) {
    return "";
  }

  try {
    const url = new URL(value);

    return url.origin;
  } catch {
    return "";
  }
}

function getAllowedOrigins(request: NextRequest) {
  const requestOrigin = request.nextUrl.origin;

  const envOrigins = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ]
    .filter(Boolean)
    .map((value) => normalizeOrigin(String(value)))
    .filter(Boolean);

  return Array.from(new Set([requestOrigin, ...envOrigins]));
}

export function isUnsafeMethod(method: string) {
  return !SAFE_METHODS.includes(method.toUpperCase());
}

export function validateSameOriginRequest(request: NextRequest) {
  if (!isUnsafeMethod(request.method)) {
    return {
      ok: true as const,
    };
  }

  const origin = normalizeOrigin(request.headers.get("origin"));
  const referer = normalizeOrigin(request.headers.get("referer"));
  const allowedOrigins = getAllowedOrigins(request);

  /*
   * 브라우저 fetch/form 요청은 보통 Origin 헤더가 있습니다.
   * 일부 환경에서는 Referer만 있을 수 있으므로 보조로 허용합니다.
   */
  const requestSource = origin || referer;

  if (!requestSource) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          ok: false,
          message: "요청 출처를 확인할 수 없습니다.",
        },
        {
          status: 403,
        },
      ),
    };
  }

  if (!allowedOrigins.includes(requestSource)) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          ok: false,
          message: "허용되지 않은 요청 출처입니다.",
        },
        {
          status: 403,
        },
      ),
    };
  }

  return {
    ok: true as const,
  };
}

export function requireSameOrigin(request: NextRequest) {
  return validateSameOriginRequest(request);
}