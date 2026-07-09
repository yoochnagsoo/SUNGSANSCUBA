"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  CalendarDays,
  ClipboardList,
  ImageIcon,
  LayoutDashboard,
  MapPin,
  Menu,
  MessageCircle,
  Settings,
  TrendingUp,
  Users,
  X,
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

export default function AdminMobileMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

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
              <Link href="/admin" onClick={closeMenu} className="min-w-0">
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
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActivePath(pathname, item.href);

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
                          active ? "text-white" : "text-slate-400",
                        ].join(" ")}
                      />
                      <span className="min-w-0 truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>

            <div className="shrink-0 border-t border-slate-200 bg-white p-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-500">
                  관리자 모드
                </p>
                <p className="mt-1 truncate text-sm font-bold text-slate-900">
                  SUNGSAN SCUBA Dive Center
                </p>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}