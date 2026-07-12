import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SEA_LATITUDE = 33.4667;
const SEA_LONGITUDE = 126.935;
const TIME_ZONE = "Asia/Seoul";

type WeatherResponse = {
  current?: {
    time?: string;
    temperature_2m?: number;
    weather_code?: number;
    wind_speed_10m?: number;
    wind_direction_10m?: number;
    wind_gusts_10m?: number;
  };
};

type MarineResponse = {
  current?: {
    time?: string;
    wave_height?: number;
    wave_period?: number;
    sea_surface_temperature?: number;
    ocean_current_velocity?: number;
  };
};

function getWeatherLabel(code?: number) {
  if (typeof code !== "number") {
    return "확인 중";
  }

  if (code === 0) {
    return "맑음";
  }

  if ([1, 2, 3].includes(code)) {
    return "구름";
  }

  if ([45, 48].includes(code)) {
    return "안개";
  }

  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return "비";
  }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return "눈";
  }

  if ([95, 96, 99].includes(code)) {
    return "뇌우";
  }

  return "변동";
}

function getWindDirectionLabel(degrees?: number) {
  if (typeof degrees !== "number" || !Number.isFinite(degrees)) {
    return "-";
  }

  const directions = [
    "북",
    "북동",
    "동",
    "남동",
    "남",
    "남서",
    "서",
    "북서",
  ];
  const index = Math.round(degrees / 45) % directions.length;

  return directions[index];
}

function round(value?: number, digits = 1) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  const scale = 10 ** digits;

  return Math.round(value * scale) / scale;
}

async function fetchJson<T>(url: URL) {
  const response = await fetch(url, {
    next: {
      revalidate: 600,
    },
  });

  if (!response.ok) {
    throw new Error(`Open-Meteo request failed with ${response.status}.`);
  }

  return (await response.json()) as T;
}

export async function GET() {
  const weatherUrl = new URL("https://api.open-meteo.com/v1/forecast");
  weatherUrl.searchParams.set("latitude", String(SEA_LATITUDE));
  weatherUrl.searchParams.set("longitude", String(SEA_LONGITUDE));
  weatherUrl.searchParams.set(
    "current",
    [
      "temperature_2m",
      "weather_code",
      "wind_speed_10m",
      "wind_direction_10m",
      "wind_gusts_10m",
    ].join(","),
  );
  weatherUrl.searchParams.set("wind_speed_unit", "ms");
  weatherUrl.searchParams.set("timezone", TIME_ZONE);
  weatherUrl.searchParams.set("forecast_days", "1");

  const marineUrl = new URL("https://marine-api.open-meteo.com/v1/marine");
  marineUrl.searchParams.set("latitude", String(SEA_LATITUDE));
  marineUrl.searchParams.set("longitude", String(SEA_LONGITUDE));
  marineUrl.searchParams.set(
    "current",
    [
      "wave_height",
      "wave_period",
      "sea_surface_temperature",
      "ocean_current_velocity",
    ].join(","),
  );
  marineUrl.searchParams.set("timezone", TIME_ZONE);
  marineUrl.searchParams.set("cell_selection", "sea");

  try {
    const [weather, marine] = await Promise.all([
      fetchJson<WeatherResponse>(weatherUrl),
      fetchJson<MarineResponse>(marineUrl),
    ]);

    const weatherCurrent = weather.current ?? {};
    const marineCurrent = marine.current ?? {};

    return NextResponse.json({
      ok: true,
      location: {
        name: "수마포구",
        latitude: SEA_LATITUDE,
        longitude: SEA_LONGITUDE,
      },
      updatedAt: weatherCurrent.time || marineCurrent.time || "",
      weather: {
        label: getWeatherLabel(weatherCurrent.weather_code),
        temperatureCelsius: round(weatherCurrent.temperature_2m),
        windSpeedMs: round(weatherCurrent.wind_speed_10m),
        windGustMs: round(weatherCurrent.wind_gusts_10m),
        windDirectionDegrees: round(weatherCurrent.wind_direction_10m, 0),
        windDirectionLabel: getWindDirectionLabel(
          weatherCurrent.wind_direction_10m,
        ),
      },
      marine: {
        seaSurfaceTemperatureCelsius: round(
          marineCurrent.sea_surface_temperature,
        ),
        waveHeightMeters: round(marineCurrent.wave_height),
        wavePeriodSeconds: round(marineCurrent.wave_period),
        oceanCurrentVelocityKmh: round(marineCurrent.ocean_current_velocity),
      },
      source: "Open-Meteo",
    });
  } catch (error) {
    console.error("[GET /api/sea-live/conditions]", error);

    return NextResponse.json(
      {
        ok: false,
        message: "바다 상황 정보를 불러오지 못했습니다.",
      },
      {
        status: 502,
      },
    );
  }
}
