"use client";

import { useEffect, useState } from "react";

type SeaConditionsResponse = {
  ok: boolean;
  message?: string;
  updatedAt?: string;
  weather?: {
    label: string;
    temperatureCelsius: number | null;
    windSpeedMs: number | null;
    windGustMs: number | null;
    windDirectionLabel: string;
  };
  marine?: {
    seaSurfaceTemperatureCelsius: number | null;
    waveHeightMeters: number | null;
    wavePeriodSeconds: number | null;
    oceanCurrentVelocityKmh: number | null;
  };
};

type SeaConditionsPanelProps = {
  compact?: boolean;
};

function formatValue(value: number | null | undefined, unit: string) {
  if (typeof value !== "number") {
    return "-";
  }

  return `${value}${unit}`;
}

function formatUpdatedAt(value?: string) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value.replace("T", " ");
  }

  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SeaConditionsPanel({
  compact = false,
}: SeaConditionsPanelProps) {
  const [data, setData] = useState<SeaConditionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadConditions() {
      try {
        setLoading(true);
        setErrorMessage("");

        const response = await fetch("/api/sea-live/conditions", {
          cache: "no-store",
        });
        const nextData = (await response.json()) as SeaConditionsResponse;

        if (!response.ok || !nextData.ok) {
          throw new Error(
            nextData.message || "바다 상황 정보를 불러오지 못했습니다.",
          );
        }

        if (!cancelled) {
          setData(nextData);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "바다 상황 정보를 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadConditions();

    const intervalId = window.setInterval(loadConditions, 10 * 60 * 1000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, []);

  const weather = data?.weather;
  const marine = data?.marine;
  const items = [
    {
      label: "날씨",
      value: weather?.label || "-",
    },
    {
      label: "기온",
      value: formatValue(weather?.temperatureCelsius, "°C"),
    },
    {
      label: "수온",
      value: formatValue(marine?.seaSurfaceTemperatureCelsius, "°C"),
    },
    {
      label: "풍속",
      value: formatValue(weather?.windSpeedMs, " m/s"),
      hint: weather?.windDirectionLabel,
    },
    {
      label: "파고",
      value: formatValue(marine?.waveHeightMeters, " m"),
    },
    {
      label: "파주기",
      value: formatValue(marine?.wavePeriodSeconds, "초"),
    },
  ];

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-black text-slate-950">바다 상황</p>
        <div className="mt-4 grid gap-3">
          {Array.from({ length: compact ? 4 : 6 }).map((_, index) => (
            <div
              key={index}
              className="h-10 animate-pulse rounded-xl bg-slate-100"
            />
          ))}
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm font-bold leading-6 text-amber-800">
        {errorMessage}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black text-cyan-600">SEA CONDITIONS</p>
          <h2 className="mt-1 text-lg font-black text-slate-950">
            오늘의 바다 상황
          </h2>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-500">
          {formatUpdatedAt(data?.updatedAt)}
        </span>
      </div>

      <div
        className={[
          "mt-5 grid gap-3",
          compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-2",
        ].join(" ")}
      >
        {items.slice(0, compact ? 4 : items.length).map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3"
          >
            <p className="text-xs font-bold text-slate-500">{item.label}</p>
            <p className="mt-1 text-base font-black text-slate-950">
              {item.value}
            </p>
            {item.hint ? (
              <p className="mt-0.5 text-[11px] font-bold text-slate-400">
                {item.hint}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      <p className="mt-4 text-[11px] font-semibold leading-5 text-slate-400">
        Open-Meteo 예보 모델 기반 정보이며, 실제 현장 판단은 CCTV와
        현장 안내를 함께 참고해주세요.
      </p>
    </div>
  );
}
