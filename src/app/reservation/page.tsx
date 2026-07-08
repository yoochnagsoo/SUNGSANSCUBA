"use client";

import Link from "next/link";
import { useState } from "react";
import { createReservation } from "@/lib/reservation-api";

type SubmitStatus = "idle" | "submitting" | "success" | "error";

export default function ReservationPage() {
  const [status, setStatus] = useState<SubmitStatus>("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formElement = e.currentTarget;
    const form = new FormData(formElement);

    setStatus("submitting");

    try {
      await createReservation({
        name: String(form.get("name") || ""),
        phone: String(form.get("phone") || ""),
        email: String(form.get("email") || ""),
        program: String(form.get("program") || ""),
        date: String(form.get("date") || ""),
        people: String(form.get("people") || ""),
        message: String(form.get("message") || ""),
      });

      formElement.reset();
      setStatus("success");
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  }

  return (
    <main className="min-h-screen bg-[#05070A] text-white">
      <section className="px-6 py-10 md:px-12 lg:px-20">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/"
            className="text-sm tracking-[0.25em] text-white/50 hover:text-white"
          >
            ← BACK TO HOME
          </Link>

          <div className="mt-20 grid gap-14 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="mb-5 text-sm tracking-[0.35em] text-cyan-300/70">
                RESERVATION
              </p>

              <h1 className="text-5xl font-light tracking-tight md:text-7xl">
                Book Your
                <br />
                Dive Experience
              </h1>

              <p className="mt-8 max-w-md text-lg leading-8 text-white/60">
                SUNGSAN SCUBA Dive Center에서 체험다이빙, 펀다이빙,
                교육 프로그램 예약을 도와드립니다.
              </p>

              <div className="mt-12 space-y-5 border-l border-white/10 pl-6 text-sm text-white/50">
                <p>운영 시간 · 09:00 - 18:00</p>
                <p>위치 · Jeju Seongsan</p>
                <p>예약 확인 후 담당자가 연락드립니다.</p>
              </div>
            </div>

            <form
              onSubmit={handleSubmit}
              className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl md:p-10"
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Name">
                  <input name="name" required className={inputClass} />
                </Field>

                <Field label="Phone">
                  <input name="phone" required className={inputClass} />
                </Field>

                <Field label="Email">
                  <input
                    name="email"
                    type="email"
                    required
                    className={inputClass}
                  />
                </Field>

                <Field label="Program">
                  <select name="program" required className={inputClass}>
                    <option value="">Select program</option>
                    <option value="Discover Scuba">Discover Scuba</option>
                    <option value="Fun Diving">Fun Diving</option>
                    <option value="Open Water Course">
                      Open Water Course
                    </option>
                    <option value="Advanced Course">Advanced Course</option>
                  </select>
                </Field>

                <Field label="Date">
                  <input
                    name="date"
                    type="date"
                    required
                    className={inputClass}
                  />
                </Field>

                <Field label="People">
                  <input
                    name="people"
                    type="number"
                    min="1"
                    max="20"
                    required
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="Message" className="mt-5">
                <textarea
                  name="message"
                  rows={5}
                  className={inputClass}
                  placeholder="희망 시간, 경험 여부, 요청사항을 적어주세요."
                />
              </Field>

              <button
                disabled={status === "submitting"}
                className="mt-8 w-full rounded-full bg-white px-8 py-4 text-sm font-medium tracking-[0.25em] text-black transition hover:bg-cyan-200 disabled:opacity-60"
              >
                {status === "submitting"
                  ? "SENDING..."
                  : "REQUEST RESERVATION"}
              </button>

              {status === "success" && (
                <p className="mt-5 text-center text-sm text-cyan-300">
                  예약 요청이 접수되었습니다.
                </p>
              )}

              {status === "error" && (
                <p className="mt-5 text-center text-sm text-red-300">
                  예약 접수 중 오류가 발생했습니다.
                </p>
              )}
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-xs tracking-[0.25em] text-white/40">
        {label.toUpperCase()}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-white outline-none transition placeholder:text-white/25 focus:border-cyan-300/60 focus:bg-black/50";