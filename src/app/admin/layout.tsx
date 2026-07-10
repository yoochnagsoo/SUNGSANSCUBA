import { cookies } from "next/headers";

import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { verifyAdminToken } from "@/lib/auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;

  /*
   * /admin/login도 같은 레이아웃을 사용하므로
   * 로그인 전에는 관리자 UI를 렌더링하지 않습니다.
   */
  if (!token) {
    return <>{children}</>;
  }

  const payload = await verifyAdminToken(token);

  /*
   * 만료되었거나 잘못된 토큰의 리디렉션과 쿠키 삭제는
   * middleware에서 처리합니다.
   */
  if (!payload) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-dvh overflow-x-hidden bg-slate-50">
      <AdminSidebar
        adminRole={payload.adminRole}
        adminName={payload.adminName}
        menuPermissions={payload.menuPermissions}
      />

      <div className="flex min-h-dvh min-w-0 flex-col lg:pl-72">
        <AdminHeader
          adminId={payload.adminId}
          adminName={payload.adminName}
          adminRole={payload.adminRole}
        />

        <main className="min-w-0 flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}