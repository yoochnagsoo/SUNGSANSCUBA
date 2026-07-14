"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Anchor,
  BarChart3,
  CalendarDays,
  ClipboardList,
  ImageIcon,
  LayoutDashboard,
  MapPin,
  MessageCircle,
  Fish,
  ReceiptText,
  Settings,
  Ship,
  TrendingUp,
  UserCog,
  Users,
} from "lucide-react";

import type { AdminRole } from "@/lib/adminAccounts";
import {
  canAccessAdminMenu,
  type AdminMenuKey,
} from "@/lib/adminPermissions";

type AdminSidebarProps = {
  adminRole: AdminRole;
  adminName: string;
  menuPermissions: AdminMenuKey[];
};

const menuItems: Array<{
  key: AdminMenuKey;
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
}> = [
  {
    key: "DASHBOARD",
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    key: "RESERVATIONS",
    name: "예약 관리",
    href: "/admin/reservations",
    icon: ClipboardList,
  },
  {
    key: "GROUP_DIVES",
    name: "그룹 다이빙",
    href: "/admin/group-dives",
    icon: Ship,
  },
  {
    /*
     * 보트 운항 스케줄은 그룹 다이빙 권한을 함께 사용합니다.
     * 별도의 AdminMenuKey 추가가 필요하지 않습니다.
     */
    key: "GROUP_DIVES",
    name: "보트 운항 스케줄",
    href: "/admin/boat-schedules",
    icon: Anchor,
  },
  {
    key: "CALENDAR",
    name: "캘린더",
    href: "/admin/calendar",
    icon: CalendarDays,
  },
  {
    key: "CUSTOMERS",
    name: "고객 관리",
    href: "/admin/customers",
    icon: Users,
  },
  {
    key: "VISITOR_LOGS",
    name: "방문 로그",
    href: "/admin/visitor-logs",
    icon: BarChart3,
  },
  {
    key: "SALES",
    name: "매출 관리",
    href: "/admin/sales",
    icon: TrendingUp,
  },
  {
    key: "EXPENSES",
    name: "경비·지출 관리",
    href: "/admin/expenses",
    icon: ReceiptText,
  },
  {
    key: "GALLERY",
    name: "갤러리 관리",
    href: "/admin/gallery",
    icon: ImageIcon,
  },
  {
    key: "REVIEWS",
    name: "리뷰 관리",
    href: "/admin/reviews",
    icon: MessageCircle,
  },
  {
    key: "DISCOVER_SCUBA_FISH",
    name: "체험 생물 관리",
    href: "/admin/discover-scuba-fish",
    icon: Fish,
  },
  {
    key: "DIVE_DESTINATIONS",
    name: "다이빙 포인트 관리",
    href: "/admin/dive-destinations",
    icon: MapPin,
  },
  {
    key: "ACCOUNTS",
    name: "관리자 계정",
    href: "/admin/accounts",
    icon: UserCog,
  },
  {
    key: "SETTINGS",
    name: "설정",
    href: "/admin/settings",
    icon: Settings,
  },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminSidebar({
  adminRole,
  adminName,
  menuPermissions,
}: AdminSidebarProps) {
  const pathname = usePathname();

  const accessibleMenuItems = menuItems.filter((item) =>
    canAccessAdminMenu(
      adminRole,
      menuPermissions,
      item.key,
    ),
  );

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-dvh w-72 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <div className="flex h-20 shrink-0 items-center border-b border-slate-200 px-6">
        <Link href="/admin" className="min-w-0">
          <p className="truncate text-sm font-semibold text-cyan-600">
            SEONG SAN SCUBA
          </p>

          <h1 className="truncate text-lg font-bold text-slate-900">
            Admin
          </h1>
        </Link>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {accessibleMenuItems.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(
              pathname,
              item.href,
            );

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex min-w-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                  active
                    ? "bg-cyan-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                ].join(" ")}
              >
                <Icon className="h-5 w-5 shrink-0" />

                <span className="min-w-0 truncate">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="shrink-0 border-t border-slate-200 p-4">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-semibold text-slate-500">
            로그인 관리자
          </p>

          <p className="mt-1 truncate text-sm font-bold text-slate-900">
            {adminName}
          </p>

          <p className="mt-1 text-xs font-semibold text-cyan-700">
            {adminRole}
          </p>
        </div>
      </div>
    </aside>
  );
}
