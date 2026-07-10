import type { AdminRole } from "@/lib/adminAccounts";

export type AdminMenuKey =
  | "DASHBOARD"
  | "RESERVATIONS"
  | "CALENDAR"
  | "CUSTOMERS"
  | "VISITOR_LOGS"
  | "SALES"
  | "GALLERY"
  | "REVIEWS"
  | "DIVE_DESTINATIONS"
  | "ACCOUNTS"
  | "SETTINGS";

export type AdminMenuDefinition = {
  key: AdminMenuKey;
  name: string;
  href: string;
  description: string;
  assignable: boolean;
};

export const ADMIN_MENU_DEFINITIONS: AdminMenuDefinition[] = [
  {
    key: "DASHBOARD",
    name: "Dashboard",
    href: "/admin",
    description: "관리자 메인 화면과 주요 현황을 확인합니다.",
    assignable: false,
  },
  {
    key: "RESERVATIONS",
    name: "예약 관리",
    href: "/admin/reservations",
    description: "예약 목록을 조회하고 예약 상태를 관리합니다.",
    assignable: true,
  },
  {
    key: "CALENDAR",
    name: "캘린더",
    href: "/admin/calendar",
    description: "예약과 직원 일정을 캘린더에서 확인합니다.",
    assignable: true,
  },
  {
    key: "CUSTOMERS",
    name: "고객 관리",
    href: "/admin/customers",
    description: "고객별 예약 이력과 고객 정보를 확인합니다.",
    assignable: true,
  },
  {
    key: "VISITOR_LOGS",
    name: "방문 로그",
    href: "/admin/visitor-logs",
    description: "관리자 및 사이트 방문 기록을 확인합니다.",
    assignable: true,
  },
  {
    key: "SALES",
    name: "매출 관리",
    href: "/admin/sales",
    description: "예약 매출과 기간별 매출 현황을 확인합니다.",
    assignable: true,
  },
  {
    key: "GALLERY",
    name: "갤러리 관리",
    href: "/admin/gallery",
    description: "홈페이지 갤러리 사진을 등록하고 관리합니다.",
    assignable: true,
  },
  {
    key: "REVIEWS",
    name: "리뷰 관리",
    href: "/admin/reviews",
    description: "고객 리뷰를 등록하고 노출 상태를 관리합니다.",
    assignable: true,
  },
  {
    key: "DIVE_DESTINATIONS",
    name: "다이빙 포인트 관리",
    href: "/admin/dive-destinations",
    description: "다이빙 포인트 정보를 등록하고 관리합니다.",
    assignable: true,
  },
  {
    key: "ACCOUNTS",
    name: "관리자 계정",
    href: "/admin/accounts",
    description: "관리자 계정과 메뉴별 접근 권한을 관리합니다.",
    assignable: false,
  },
  {
    key: "SETTINGS",
    name: "설정",
    href: "/admin/settings",
    description: "사이트 및 관리자 시스템 설정을 관리합니다.",
    assignable: true,
  },
];

export const ALL_ADMIN_MENU_KEYS: AdminMenuKey[] =
  ADMIN_MENU_DEFINITIONS.map((menu) => menu.key);

export const ASSIGNABLE_ADMIN_MENU_KEYS: AdminMenuKey[] =
  ADMIN_MENU_DEFINITIONS.filter((menu) => menu.assignable).map(
    (menu) => menu.key,
  );

const MANAGER_DEFAULT_MENU_KEYS: AdminMenuKey[] = [
  "DASHBOARD",
  "RESERVATIONS",
  "CALENDAR",
  "CUSTOMERS",
  "VISITOR_LOGS",
  "SALES",
  "GALLERY",
  "REVIEWS",
  "DIVE_DESTINATIONS",
];

const STAFF_DEFAULT_MENU_KEYS: AdminMenuKey[] = [
  "DASHBOARD",
  "RESERVATIONS",
  "CALENDAR",
  "GALLERY",
  "REVIEWS",
  "DIVE_DESTINATIONS",
];

export function isAdminMenuKey(
  value: unknown,
): value is AdminMenuKey {
  return ALL_ADMIN_MENU_KEYS.includes(value as AdminMenuKey);
}

export function getDefaultAdminMenuPermissions(
  role: AdminRole,
): AdminMenuKey[] {
  if (role === "OWNER") {
    return [...ALL_ADMIN_MENU_KEYS];
  }

  if (role === "MANAGER") {
    return [...MANAGER_DEFAULT_MENU_KEYS];
  }

  return [...STAFF_DEFAULT_MENU_KEYS];
}

export function normalizeAdminMenuPermissions(
  value: unknown,
  role: AdminRole,
): AdminMenuKey[] {
  if (role === "OWNER") {
    return [...ALL_ADMIN_MENU_KEYS];
  }

  if (!Array.isArray(value)) {
    return getDefaultAdminMenuPermissions(role);
  }

  const normalized = new Set<AdminMenuKey>();

  normalized.add("DASHBOARD");

  for (const item of value) {
    if (!isAdminMenuKey(item)) {
      continue;
    }

    if (item === "ACCOUNTS") {
      continue;
    }

    normalized.add(item);
  }

  return ALL_ADMIN_MENU_KEYS.filter((key) => normalized.has(key));
}

export function getAdminMenuDefinition(
  key: AdminMenuKey,
): AdminMenuDefinition | null {
  return (
    ADMIN_MENU_DEFINITIONS.find((menu) => menu.key === key) ??
    null
  );
}

export function canAccessAdminMenu(
  role: AdminRole,
  menuPermissions: AdminMenuKey[],
  key: AdminMenuKey,
) {
  if (role === "OWNER") {
    return true;
  }

  if (key === "ACCOUNTS") {
    return false;
  }

  return menuPermissions.includes(key);
}

function matchesAdminPath(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function getAdminMenuKeyByPathname(
  pathname: string,
): AdminMenuKey | null {
  const matchedMenu = [...ADMIN_MENU_DEFINITIONS]
    .sort((a, b) => b.href.length - a.href.length)
    .find((menu) => matchesAdminPath(pathname, menu.href));

  return matchedMenu?.key ?? null;
}

export function isAdminPageAllowed(
  role: AdminRole,
  menuPermissions: AdminMenuKey[],
  pathname: string,
) {
  if (pathname === "/admin/login") {
    return true;
  }

  const menuKey = getAdminMenuKeyByPathname(pathname);

  if (menuKey) {
    return canAccessAdminMenu(role, menuPermissions, menuKey);
  }

  /*
   * 권한 규칙에 등록되지 않은 관리자 페이지는
   * OWNER만 접근할 수 있도록 기본 차단합니다.
   */
  return role === "OWNER";
}