"use client";

import { FormEvent, useState } from "react";
import { createReservation } from "@/lib/reservation-api";

const programs = [
  "체험다이빙",
  "펀다이빙",
  "오픈워터 교육",
  "어드밴스드 교육",
  "스노클링",
];

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function ReservationPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formElement = event.currentTarget;
    const form = new FormData(formElement);

    setSubmitMessage("");
    setSubmitError("");

    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim();
    const phone = String(form.get("phone") || "").trim();
    const program = String(form.get("program") || "").trim();
    const reservationDate = String(form.get("reservationDate") || "").trim();
    const people = Number(form.get("people") || 1);
    const message = String(form.get("message") || "").trim();

    if (!name) {
      setSubmitError("이름을 입력해주세요.");
      return;
    }

    if (!email) {
      setSubmitError("이메일을 입력해주세요.");
      return;
    }

    if (!phone) {
      setSubmitError("연락처를 입력해주세요.");
      return;
    }

    if (!program) {
      setSubmitError("프로그램을 선택해주세요.");
      return;
    }

    if (!reservationDate) {
      setSubmitError("예약일자를 선택해주세요.");
      return;
    }

    if (!Number.isFinite(people) || people < 1) {
      setSubmitError("예약 인원을 확인해주세요.");
      return;
    }

    try {
      setIsSubmitting(true);

      await createReservation({
        name,
        email,
        phone,
        program,
        reservationDate,
        people,
        message,
      });

      setSubmitMessage("예약 요청이 접수되었습니다.");
      formElement.reset();
    } catch (error) {
      console.error(error);
      setSubmitError("예약 접수 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-600">
            Reservation
          </p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
            SUNG SAN SCUBA 예약 신청
          </h1>
          <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base">
            원하시는 프로그램과 예약일자를 선택해주시면 확인 후
            연락드리겠습니다.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                이름 <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="홍길동"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                연락처 <span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                placeholder="010-0000-0000"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                이메일 <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="example@email.com"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </div>

            <div>
              <label
                htmlFor="program"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                프로그램 <span className="text-red-500">*</span>
              </label>
              <select
                id="program"
                name="program"
                required
                defaultValue={programs[0]}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              >
                {programs.map((program) => (
                  <option key={program} value={program}>
                    {program}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="reservationDate"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                예약일자 <span className="text-red-500">*</span>
              </label>
              <input
                id="reservationDate"
                name="reservationDate"
                type="date"
                min={getTodayDateString()}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </div>

            <div>
              <label
                htmlFor="people"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                인원 <span className="text-red-500">*</span>
              </label>
              <input
                id="people"
                name="people"
                type="number"
                min={1}
                max={20}
                defaultValue={1}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="message"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                요청사항
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                placeholder="희망 시간, 장비 사이즈, 문의사항 등을 적어주세요."
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
            </div>
          </div>

          {submitError && (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {submitError}
            </div>
          )}

          {submitMessage && (
            <div className="mt-6 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-medium text-cyan-800">
              {submitMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-8 w-full rounded-xl bg-cyan-600 px-5 py-4 text-sm font-bold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {isSubmitting ? "예약 접수 중..." : "예약 신청하기"}
          </button>
        </form>
      </section>
    </main>
  );
}