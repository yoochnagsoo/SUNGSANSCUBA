"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ClipboardList,
  ImageIcon,
  LayoutDashboard,
  MapPin,
  MessageCircle,
  Settings,
  TrendingUp,
  Users,
} from "lucide-react";

const menuItems = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "예약 관리",
    href: "/admin/reservations",
    icon: ClipboardList,
  },
  {
    name: "캘린더",
    href: "/admin/calendar",
    icon: CalendarDays,
  },
  {
    name: "고객 관리",
    href: "/admin/customers",
    icon: Users,
  },
  {
    name: "매출 관리",
    href: "/admin/sales",
    icon: TrendingUp,
  },
  {
    name: "갤러리 관리",
    href: "/admin/gallery",
    icon: ImageIcon,
  },
  {
    name: "리뷰 관리",
    href: "/admin/reviews",
    icon: MessageCircle,
  },
  {
    name: "다이빙 포인트 관리",
    href: "/admin/dive-destinations",
    icon: MapPin,
  },
  {
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

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-dvh w-72 shrink-0 border-r border-slate-200 bg-white lg:flex lg:flex-col">
      <div className="flex h-20 shrink-0 items-center border-b border-slate-200 px-6">
        <Link href="/admin" className="min-w-0">
          <p className="truncate text-sm font-semibold text-cyan-600">
            SUNGSAN SCUBA
          </p>
          <h1 className="truncate text-lg font-bold text-slate-900">Admin</h1>
        </Link>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(pathname, item.href);

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
                <span className="min-w-0 truncate">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="shrink-0 border-t border-slate-200 p-4">
        <div className="rounded-2xl bg-slate-50 p-4">
          <p className="text-xs font-semibold text-slate-500">관리자 모드</p>
          <p className="mt-1 truncate text-sm font-bold text-slate-900">
            SUNGSAN SCUBA Dive Center
          </p>
        </div>
      </div>
    </aside>
  );
}