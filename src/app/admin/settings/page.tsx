import {
  Bell,
  Building2,
  CheckCircle2,
  Cloud,
  Mail,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";

const deployItems = [
  "AWS Lambda API 연결",
  "DynamoDB 예약 테이블 연결",
  "SES 이메일 발송 설정",
  "카카오 알림톡/SMS 연동",
  "관리자 로그인 보호",
];

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-slate-900">설정</h1>
        <p className="mt-2 text-sm text-slate-500">
          센터 정보, 알림, 배포 준비 상태를 관리합니다.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-cyan-50 p-2 text-cyan-600">
              <Building2 className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              센터 기본정보
            </h2>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Info label="센터명" value="SEONG SAN SCUBA Dive Center" />
            <Info label="지역" value="제주 성산" />
            <Info label="대표 연락처" value="추후 입력" />
            <Info label="관리자 이메일" value="추후 입력" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
              <Bell className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              알림 설정
            </h2>
          </div>

          <div className="mt-6 space-y-4">
            <StatusItem
              icon={<Mail className="h-4 w-4" />}
              label="예약 이메일"
              status="준비 예정"
            />
            <StatusItem
              icon={<MessageSquare className="h-4 w-4" />}
              label="카카오 알림톡"
              status="준비 예정"
            />
            <StatusItem
              icon={<MessageSquare className="h-4 w-4" />}
              label="SMS 문자"
              status="준비 예정"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
              <Cloud className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              AWS 배포 준비
            </h2>
          </div>

          <div className="mt-6 space-y-3">
            {deployItems.map((item) => (
              <div
                key={item}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3"
              >
                <span className="text-sm font-semibold text-slate-700">
                  {item}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                  예정
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              관리자 보안
            </h2>
          </div>

          <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-6">
            <p className="text-sm font-semibold text-slate-700">
              현재 개발 단계에서는 로그인 없이 접근 가능합니다.
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              배포 전에는 관리자 로그인, 세션 보호, API 보호를 반드시
              추가해야 합니다.
            </p>
          </div>

          <div className="mt-5 flex items-center gap-2 text-sm font-bold text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            관리자 로그인 단계에서 처리 예정
          </div>
        </div>
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-2 font-bold text-slate-900">{value}</p>
    </div>
  );
}

function StatusItem({
  icon,
  label,
  status,
}: {
  icon: React.ReactNode;
  label: string;
  status: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <span className="text-slate-400">{icon}</span>
        {label}
      </div>

      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
        {status}
      </span>
    </div>
  );
}