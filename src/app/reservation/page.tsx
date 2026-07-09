"use client";

import Link from "next/link";
import {
  FormEvent,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";

import {
  PROGRAM_OPTIONS,
  getProgramOption,
  normalizeProgramValue,
} from "@/lib/programs";
import Footer from "@/components/layout/Footer";

export default function ReservationPage() {
  return (
    <Suspense fallback={<ReservationPageLoading />}>
      <ReservationPageContent />
    </Suspense>
  );
}

function ReservationPageContent() {
  const searchParams = useSearchParams();
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const phoneInputRef = useRef<HTMLInputElement | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [program, setProgram] = useState(PROGRAM_OPTIONS[0].value);
  const [reservationDate, setReservationDate] = useState("");
  const [people, setPeople] = useState(1);
  const [message, setMessage] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const selectedProgram = useMemo(() => getProgramOption(program), [program]);

  useEffect(() => {
    const programParam = searchParams.get("program");
    const dateParam = searchParams.get("reservationDate");
    const peopleParam = searchParams.get("people");

    if (programParam) {
      setProgram(normalizeProgramValue(programParam));
    }

    if (dateParam) {
      setReservationDate(dateParam);
    }

    if (peopleParam) {
      const parsedPeople = Number(peopleParam);

      if (!Number.isNaN(parsedPeople) && parsedPeople >= 1) {
        setPeople(parsedPeople);
      }
    }
  }, [searchParams]);

  function getPhoneDigits(value: string) {
    return value.replace(/\D/g, "");
  }

  function formatKoreanMobilePhone(value: string) {
    const digits = getPhoneDigits(value).slice(0, 11);

    if (digits.length <= 3) {
      return digits;
    }

    if (digits.length <= 7) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    }

    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }

  function isValidKoreanMobilePhone(value: string) {
    const digits = getPhoneDigits(value);

    return /^01[016789]\d{7,8}$/.test(digits);
  }

  function handleFocusReservationName() {
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 300);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setSuccessMessage("");
      setErrorMessage("");

      const trimmedName = name.trim();
      const formattedPhone = formatKoreanMobilePhone(phone);
      const trimmedEmail = email.trim();
      const trimmedReservationDate = reservationDate.trim();
      const trimmedMessage = message.trim();

      if (!trimmedName) {
        nameInputRef.current?.focus();
        throw new Error("이름을 입력해주세요.");
      }

      if (!formattedPhone) {
        phoneInputRef.current?.focus();
        throw new Error("연락처를 입력해주세요.");
      }

      if (!isValidKoreanMobilePhone(formattedPhone)) {
        setPhone(formattedPhone);
        phoneInputRef.current?.focus();
        throw new Error("연락처는 010-1234-5678 형식으로 입력해주세요.");
      }

      if (!trimmedReservationDate) {
        throw new Error("예약 희망일을 선택해주세요.");
      }

      if (!people || people < 1) {
        throw new Error("인원은 1명 이상이어야 합니다.");
      }

      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          phone: formattedPhone,
          email: trimmedEmail,
          program,
          reservationDate: trimmedReservationDate,
          people,
          message: trimmedMessage,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "예약 접수 중 오류가 발생했습니다.");
      }

      setSuccessMessage(
        "예약이 접수되었습니다. 확인 후 예약 확정 안내를 보내드리겠습니다.",
      );

      setName("");
      setPhone("");
      setEmail("");
      setProgram(PROGRAM_OPTIONS[0].value);
      setReservationDate("");
      setPeople(1);
      setMessage("");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "예약 접수 중 오류가 발생했습니다.";

      setErrorMessage(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f8fb] text-slate-950">
      <section className="relative overflow-hidden bg-[#061827]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(14,165,233,0.32),transparent_34%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.24),transparent_30%),linear-gradient(135deg,rgba(2,6,23,0.4),rgba(2,6,23,0.95))]" />
        <div className="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute -bottom-24 right-10 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <Link
              href="/"
              className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-black/10 backdrop-blur-md transition hover:bg-white/20"
            >
              <span className="transition group-hover:-translate-x-0.5">←</span>
              메인으로
            </Link>

            <div className="hidden items-center gap-3 sm:flex">
              <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100">
                Jeju Seongsan Dive
              </span>
            </div>
          </div>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:grid lg:grid-cols-[1fr_420px] lg:gap-12 lg:px-8 lg:pb-24 lg:pt-16">
          <div>
            <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.35em] text-cyan-100 shadow-lg shadow-black/10 backdrop-blur-md">
              SUNG SAN SCUBA
            </div>

            <h1 className="mt-7 max-w-4xl text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
              성산 바다를 가장 가까이 만나는
              <span className="block bg-gradient-to-r from-cyan-200 via-sky-300 to-blue-300 bg-clip-text text-transparent">
                프리미엄 다이빙 예약
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              체험 다이빙부터 자격증 과정까지, 예약 신청 후 관리자가 해상
              상황과 일정을 확인해 가장 안전한 시간으로 확정해드립니다.
            </p>

            <div className="mt-9 grid gap-3 sm:grid-cols-3">
              <HeroBadge title="소규모 케어" description="강사 배정 기준 운영" />
              <HeroBadge
                title="성산 바다"
                description="제주 동쪽 다이빙 포인트"
              />
              <HeroBadge title="확정 안내" description="이메일로 일정 발송" />
            </div>
          </div>

          <div className="mt-10 lg:mt-0">
            <div className="rounded-[2rem] border border-white/15 bg-white/10 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl">
              <div className="rounded-[1.5rem] bg-white p-6">
                <p className="text-sm font-bold text-slate-500">
                  현재 선택한 프로그램
                </p>

                <h2 className="mt-2 text-3xl font-black text-slate-950">
                  {selectedProgram.label}
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {selectedProgram.shortDescription}
                </p>

                <div className="mt-6 rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-500 p-5 text-white shadow-lg shadow-blue-500/20">
                  <p className="text-xs font-bold text-blue-100">PRICE</p>
                  <p className="mt-1 text-4xl font-black">
                    {selectedProgram.price}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-blue-50">
                    {selectedProgram.priceDescription}
                  </p>
                </div>

                <div className="mt-5 grid gap-3">
                  <MiniInfo label="소요시간" value={selectedProgram.duration} />
                  <MiniInfo
                    label="추천대상"
                    value={selectedProgram.recommendedFor}
                  />
                  {selectedProgram.maxGuestsPerInstructor ? (
                    <MiniInfo
                      label="진행기준"
                      value={`강사 1명당 최대 ${selectedProgram.maxGuestsPerInstructor}명`}
                    />
                  ) : null}
                </div>

                <a
                  href="#reservation-form"
                  onClick={handleFocusReservationName}
                  className="mt-6 block rounded-2xl bg-slate-950 px-5 py-4 text-center text-sm font-black text-white transition hover:bg-blue-700"
                >
                  예약 정보 입력하기
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="reservation-form"
        className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16"
      >
        <div className="grid gap-8 lg:grid-cols-[1fr_390px]">
          <form
            onSubmit={handleSubmit}
            className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/70"
          >
            <div className="border-b border-slate-100 bg-gradient-to-r from-slate-950 to-slate-800 p-6 text-white sm:p-8">
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-cyan-200">
                Reservation Form
              </p>
              <h2 className="mt-3 text-3xl font-black">예약 신청서</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                예약 신청은 접수 단계입니다. 관리자가 확인 후 체험시간과
                준비사항을 안내드립니다.
              </p>
            </div>

            <div className="p-5 sm:p-8">
              <div>
                <label className="text-sm font-black text-slate-800">
                  프로그램 선택 <span className="text-red-500">*</span>
                </label>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {PROGRAM_OPTIONS.map((item) => {
                    const selected = program === item.value;

                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setProgram(item.value)}
                        className={`group relative overflow-hidden rounded-3xl border p-5 text-left transition ${
                          selected
                            ? "border-blue-500 bg-blue-50 shadow-lg shadow-blue-100 ring-4 ring-blue-100"
                            : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg hover:shadow-slate-200"
                        }`}
                      >
                        <div className="absolute right-0 top-0 h-20 w-20 translate-x-8 -translate-y-8 rounded-full bg-blue-500/10 transition group-hover:bg-blue-500/20" />

                        <div className="relative">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-lg font-black text-slate-950">
                                {item.label}
                              </p>
                              <p className="mt-2 text-sm leading-6 text-slate-500">
                                {item.shortDescription}
                              </p>
                            </div>

                            {selected ? (
                              <span className="shrink-0 rounded-full bg-blue-600 px-3 py-1 text-xs font-black text-white">
                                선택됨
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                            <p className="text-xs font-bold text-slate-500">
                              가격
                            </p>
                            <p className="mt-1 text-2xl font-black text-slate-950">
                              {item.price}
                              {item.price !== "문의" ? (
                                <span className="ml-1 text-sm font-bold text-slate-500">
                                  / {item.priceDescription}
                                </span>
                              ) : null}
                            </p>
                            {item.price === "문의" ? (
                              <p className="mt-1 text-xs font-semibold text-slate-500">
                                {item.priceDescription}
                              </p>
                            ) : null}
                          </div>

                          <div className="mt-4 space-y-1.5 text-xs leading-5 text-slate-500">
                            <p>
                              <span className="font-black text-slate-700">
                                소요시간
                              </span>{" "}
                              {item.duration}
                            </p>
                            <p>
                              <span className="font-black text-slate-700">
                                추천대상
                              </span>{" "}
                              {item.recommendedFor}
                            </p>
                            {item.maxGuestsPerInstructor ? (
                              <p>
                                <span className="font-black text-slate-700">
                                  진행기준
                                </span>{" "}
                                강사 1명당 최대 {item.maxGuestsPerInstructor}명
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-9 grid gap-5 sm:grid-cols-2">
                <FormField label="이름" required>
                  <input
                    ref={nameInputRef}
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="홍길동"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </FormField>

                <FormField label="연락처" required>
                  <input
                    ref={phoneInputRef}
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(event) => {
                      setPhone(formatKoreanMobilePhone(event.target.value));

                      if (errorMessage.includes("연락처")) {
                        setErrorMessage("");
                      }
                    }}
                    onBlur={() =>
                      setPhone((prev) => formatKoreanMobilePhone(prev))
                    }
                    placeholder="010-0000-0000"
                    maxLength={13}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    예: 010-1234-5678
                  </p>
                </FormField>

                <div className="sm:col-span-2">
                  <FormField label="이메일">
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="example@email.com"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                  </FormField>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    이메일을 입력하면 예약 확정 및 취소 안내를 받을 수 있습니다.
                  </p>
                </div>

                <FormField label="예약 희망일" required>
                  <input
                    type="date"
                    value={reservationDate}
                    onChange={(event) => setReservationDate(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </FormField>

                <FormField label="인원" required>
                  <input
                    type="number"
                    min={1}
                    value={people}
                    onChange={(event) => setPeople(Number(event.target.value))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </FormField>

                <div className="sm:col-span-2">
                  <FormField label="요청사항">
                    <textarea
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      rows={6}
                      placeholder="희망 시간, 다이빙 경험 여부, 아이 동반 여부, 문의사항 등을 적어주세요."
                      className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-950 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
                    />
                  </FormField>
                </div>
              </div>

              {successMessage ? (
                <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
                  {successMessage}
                </div>
              ) : null}

              {errorMessage ? (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                  {errorMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="mt-7 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-4 text-base font-black text-white shadow-lg shadow-blue-500/25 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/30 disabled:cursor-not-allowed disabled:from-slate-400 disabled:to-slate-400"
              >
                {submitting ? "예약 접수 중..." : "예약 신청하기"}
              </button>
            </div>
          </form>

          <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
            <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
              <div className="bg-slate-950 p-6 text-white">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-200">
                  Selected
                </p>
                <h3 className="mt-2 text-3xl font-black">
                  {selectedProgram.label}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {selectedProgram.shortDescription}
                </p>
              </div>

              <div className="p-6">
                <div className="rounded-3xl bg-gradient-to-br from-blue-50 to-cyan-50 p-5 ring-1 ring-blue-100">
                  <p className="text-xs font-black text-blue-700">가격</p>
                  <p className="mt-1 text-4xl font-black text-blue-950">
                    {selectedProgram.price}
                  </p>
                  <p className="mt-1 text-sm font-bold text-blue-700">
                    {selectedProgram.priceDescription}
                  </p>
                </div>

                <div className="mt-5 space-y-3">
                  <InfoBox label="소요시간" value={selectedProgram.duration} />
                  <InfoBox
                    label="추천대상"
                    value={selectedProgram.recommendedFor}
                  />
                  {selectedProgram.maxGuestsPerInstructor ? (
                    <InfoBox
                      label="진행기준"
                      value={`강사 1명당 최대 ${selectedProgram.maxGuestsPerInstructor}명`}
                    />
                  ) : null}
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/60">
              <h3 className="text-xl font-black text-slate-950">예약 절차</h3>

              <div className="mt-5 space-y-3">
                <GuideItem number="01" title="예약 신청" />
                <GuideItem number="02" title="일정 및 해상 상황 확인" />
                <GuideItem number="03" title="체험시간 확정 안내" />
                <GuideItem number="04" title="방문 및 안전 브리핑" />
              </div>
            </div>

            <div className="rounded-[2rem] border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-lg shadow-amber-100/60">
              <h3 className="text-lg font-black text-amber-950">안전 안내</h3>
              <p className="mt-3 text-sm leading-7 text-amber-900">
                해상 상황과 날씨에 따라 체험 시간이 조정되거나 예약이 변경될 수
                있습니다. 음주 후 체험은 안전상 불가합니다.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section id="location" className="scroll-mt-24">
        <Footer />
      </section>
    </main>
  );
}

function ReservationPageLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#061827] text-white">
      <div className="rounded-3xl border border-white/10 bg-white/10 px-6 py-5 text-center shadow-2xl shadow-black/30 backdrop-blur-xl">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-cyan-200">
          SUNG SAN SCUBA
        </p>
        <p className="mt-3 text-lg font-bold">예약 페이지를 불러오는 중...</p>
      </div>
    </main>
  );
}

function HeroBadge({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/10 p-5 shadow-lg shadow-black/10 backdrop-blur-md">
      <p className="font-black text-white">{title}</p>
      <p className="mt-1 text-sm text-slate-300">{description}</p>
    </div>
  );
}

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-black text-slate-500">{label}</p>
      <p className="text-right text-sm font-bold text-slate-950">{value}</p>
    </div>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm font-black text-slate-800">
        {label}
        {required ? <span className="ml-1 text-red-500">*</span> : null}
      </label>
      {children}
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
      <p className="text-xs font-black text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-bold leading-6 text-slate-950">{value}</p>
    </div>
  );
}

function GuideItem({ number, title }: { number: string; title: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">
        {number}
      </div>
      <p className="text-sm font-bold text-slate-800">{title}</p>
    </div>
  );
}