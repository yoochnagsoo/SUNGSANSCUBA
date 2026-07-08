"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";

const menuItems = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "예약 관리", href: "/admin/reservations", icon: ClipboardList },
  { name: "캘린더", href: "/admin/calendar", icon: CalendarDays },
  { name: "고객 관리", href: "/admin/customers", icon: Users },
  { name: "설정", href: "/admin/settings", icon: Settings },
];

export default function AdminMobileMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-slate-900/40"
          />

          <aside className="relative h-full w-72 bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
              <div>
                <p className="text-xs font-semibold text-cyan-600">
                  SUNGSAN SCUBA
                </p>
                <p className="text-base font-bold text-slate-900">
                  Admin
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="space-y-1 p-4">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active =
                  item.href === "/admin"
                    ? pathname === "/admin"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={[
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                      active
                        ? "bg-cyan-600 text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                    ].join(" ")}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}