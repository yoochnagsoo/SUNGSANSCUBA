import AdminMobileMenu from "./AdminMobileMenu";
import AdminLogoutButton from "@/components/admin/AdminLogoutButton";

export default function AdminHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex h-16 min-w-0 items-center justify-between gap-3 px-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <AdminMobileMenu />

          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-slate-500">
              관리자 페이지
            </p>
            <h2 className="truncate text-sm font-bold text-slate-900 sm:text-lg">
              SUNG SAN SCUBA Dive Center
            </h2>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 sm:block">
            Admin
          </div>

          <AdminLogoutButton />
        </div>
      </div>
    </header>
  );
}