"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
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
    name: "설정",
    href: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-white lg:block">
      <div className="flex h-20 items-center border-b border-slate-200 px-6">
        <div>
          <p className="text-sm font-semibold text-cyan-600">
            SUNGSAN SCUBA
          </p>
          <h1 className="text-lg font-bold text-slate-900">Admin</h1>
        </div>
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
              className={[
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition",
                active
                  ? "bg-cyan-600 text-white shadow-sm"
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
  );
}