import {
  NextRequest,
  NextResponse,
} from "next/server";

import { isAdminPageAllowed } from "@/lib/adminPermissions";
import { verifyAdminToken } from "@/lib/auth";

const ADMIN_LOGIN_PAGE_PATH = "/admin/login";
const ADMIN_LOGIN_API_PATH = "/api/admin/login";

function isAdminPagePath(pathname: string) {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/")
  );
}

function isAdminApiPath(pathname: string) {
  return (
    pathname === "/api/admin" ||
    pathname.startsWith("/api/admin/")
  );
}

function isPublicAdminPath(pathname: string) {
  return (
    pathname === ADMIN_LOGIN_PAGE_PATH ||
    pathname === ADMIN_LOGIN_API_PATH
  );
}

function applySecurityHeaders(response: NextResponse) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set(
    "X-Content-Type-Options",
    "nosniff",
  );
  response.headers.set(
    "Referrer-Policy",
    "strict-origin-when-cross-origin",
  );
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }

  return response;
}

function clearAdminToken(response: NextResponse) {
  response.cookies.set({
    name: "admin_token",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}

function createUnauthorizedApiResponse(
  message = "관리자 인증이 필요합니다.",
) {
  return NextResponse.json(
    {
      ok: false,
      message,
    },
    {
      status: 401,
    },
  );
}

function nextWithSecurityHeaders() {
  return applySecurityHeaders(NextResponse.next());
}

function redirectWithSecurityHeaders(url: URL) {
  return applySecurityHeaders(
    NextResponse.redirect(url),
  );
}

function unauthorizedApiResponseWithSecurityHeaders(
  message?: string,
) {
  return applySecurityHeaders(
    createUnauthorizedApiResponse(message),
  );
}

export async function middleware(
  request: NextRequest,
) {
  const { pathname } = request.nextUrl;

  const isAdminPage = isAdminPagePath(pathname);
  const isAdminApi = isAdminApiPath(pathname);

  if (!isAdminPage && !isAdminApi) {
    return nextWithSecurityHeaders();
  }

  const token =
    request.cookies.get("admin_token")?.value;

  if (pathname === ADMIN_LOGIN_PAGE_PATH) {
    if (!token) {
      return nextWithSecurityHeaders();
    }

    try {
      const payload = await verifyAdminToken(token);

      if (payload) {
        return redirectWithSecurityHeaders(
          new URL("/admin", request.url),
        );
      }

      return clearAdminToken(
        nextWithSecurityHeaders(),
      );
    } catch (error) {
      console.error(
        "관리자 로그인 페이지 토큰 검증 오류:",
        error,
      );

      return clearAdminToken(
        nextWithSecurityHeaders(),
      );
    }
  }

  if (isPublicAdminPath(pathname)) {
    return nextWithSecurityHeaders();
  }

  if (!token) {
    if (isAdminApi) {
      return unauthorizedApiResponseWithSecurityHeaders();
    }

    const loginUrl = new URL(
      ADMIN_LOGIN_PAGE_PATH,
      request.url,
    );

    if (pathname !== "/admin") {
      loginUrl.searchParams.set(
        "redirect",
        pathname,
      );
    }

    return redirectWithSecurityHeaders(loginUrl);
  }

  try {
    const payload = await verifyAdminToken(token);

    if (!payload) {
      if (isAdminApi) {
        return clearAdminToken(
          unauthorizedApiResponseWithSecurityHeaders(
            "관리자 인증이 만료되었거나 유효하지 않습니다.",
          ),
        );
      }

      const loginUrl = new URL(
        ADMIN_LOGIN_PAGE_PATH,
        request.url,
      );

      if (pathname !== "/admin") {
        loginUrl.searchParams.set(
          "redirect",
          pathname,
        );
      }

      return clearAdminToken(
        redirectWithSecurityHeaders(loginUrl),
      );
    }

    if (
      isAdminPage &&
      !isAdminPageAllowed(
        payload.adminRole,
        payload.menuPermissions,
        pathname,
      )
    ) {
      const forbiddenUrl = new URL(
        "/admin",
        request.url,
      );

      forbiddenUrl.searchParams.set(
        "forbidden",
        "1",
      );

      return redirectWithSecurityHeaders(
        forbiddenUrl,
      );
    }

    return nextWithSecurityHeaders();
  } catch (error) {
    console.error(
      "관리자 토큰 검증 오류:",
      error,
    );

    if (isAdminApi) {
      return clearAdminToken(
        unauthorizedApiResponseWithSecurityHeaders(
          "관리자 인증을 확인하는 중 오류가 발생했습니다.",
        ),
      );
    }

    const loginUrl = new URL(
      ADMIN_LOGIN_PAGE_PATH,
      request.url,
    );

    return clearAdminToken(
      redirectWithSecurityHeaders(loginUrl),
    );
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};