"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Anchor,
  BarChart3,
  CalendarDays,
  ClipboardList,
  ImageIcon,
  LayoutDashboard,
  MapPin,
  Menu,
  MessageCircle,
  ReceiptText,
  Settings,
  Ship,
  TrendingUp,
  UserCog,
  Users,
  X,
} from "lucide-react";

import type { AdminRole } from "@/lib/adminAccounts";
import {
  canAccessAdminMenu,
  type AdminMenuKey,
} from "@/lib/adminPermissions";

type AdminMobileMenuProps = {
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

export default function AdminMobileMenu({
  adminRole,
  adminName,
  menuPermissions,
}: AdminMobileMenuProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const accessibleMenuItems = menuItems.filter((item) =>
    canAccessAdminMenu(
      adminRole,
      menuPermissions,
      item.key,
    ),
  );

  function closeMenu() {
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="관리자 메뉴 열기"
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[9999] lg:hidden">
          <button
            type="button"
            aria-label="관리자 메뉴 닫기"
            onClick={closeMenu}
            className="absolute inset-0 h-full w-full bg-slate-950/55"
          />

          <aside className="absolute left-0 top-0 z-[10000] flex h-dvh w-[84vw] max-w-[320px] flex-col overflow-hidden border-r border-slate-200 bg-white text-slate-900 shadow-2xl">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
              <Link
                href="/admin"
                onClick={closeMenu}
                className="min-w-0"
              >
                <p className="truncate text-xs font-black uppercase tracking-[0.12em] text-cyan-600">
                  SUNGSAN SCUBA
                </p>

                <h1 className="truncate text-base font-black text-slate-950">
                  Admin
                </h1>
              </Link>

              <button
                type="button"
                onClick={closeMenu}
                aria-label="관리자 메뉴 닫기"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="min-h-0 flex-1 overflow-y-auto bg-white px-3 py-4">
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
                      onClick={closeMenu}
                      className={[
                        "flex min-w-0 items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition",
                        active
                          ? "bg-cyan-600 text-white shadow-sm"
                          : "bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950",
                      ].join(" ")}
                    >
                      <Icon
                        className={[
                          "h-5 w-5 shrink-0",
                          active
                            ? "text-white"
                            : "text-slate-400",
                        ].join(" ")}
                      />

                      <span className="min-w-0 truncate">
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </nav>

            <div className="shrink-0 border-t border-slate-200 bg-white p-4">
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
        </div>
      ) : null}
    </>
  );
}