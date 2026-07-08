import AdminMobileMenu from "./AdminMobileMenu";
import AdminLogoutButton from "@/components/admin/AdminLogoutButton";

export default function AdminHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <AdminMobileMenu />

          <div>
            <p className="text-xs font-medium text-slate-500">
              관리자 페이지
            </p>
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">
              SUNGSAN SCUBA Dive Center
            </h2>
          </div>
        </div>

        {/* 오른쪽 */}
        <div className="flex items-center gap-3">
          <div className="hidden rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 sm:block">
            Admin
          </div>

          <AdminLogoutButton />
        </div>
      </div>
    </header>
  );
}