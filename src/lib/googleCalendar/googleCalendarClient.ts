import { SignJWT, importPKCS8 } from "jose";

import type { GoogleCalendarEventPayload } from "./types";

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API_BASE =
  "https://www.googleapis.com/calendar/v3";
const GOOGLE_CALENDAR_SCOPE =
  "https://www.googleapis.com/auth/calendar.events";

type GoogleTokenResponse = {
  access_token?: string;
  expires_in?: number;
  token_type?: string;
  error?: string;
  error_description?: string;
};

type GoogleEventResponse = {
  id?: string;
  error?: {
    message?: string;
  };
};

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not set.`);
  }

  return value;
}

function getPrivateKey() {
  return getRequiredEnv("GOOGLE_CALENDAR_PRIVATE_KEY").replace(
    /\\n/g,
    "\n",
  );
}

async function requestAccessToken() {
  const clientEmail = getRequiredEnv("GOOGLE_CALENDAR_CLIENT_EMAIL");
  const privateKey = await importPKCS8(getPrivateKey(), "RS256");
  const now = Math.floor(Date.now() / 1000);

  const assertion = await new SignJWT({
    scope: GOOGLE_CALENDAR_SCOPE,
  })
    .setProtectedHeader({
      alg: "RS256",
      typ: "JWT",
    })
    .setIssuer(clientEmail)
    .setSubject(clientEmail)
    .setAudience(GOOGLE_TOKEN_URL)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(privateKey);

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  const data = (await response.json()) as GoogleTokenResponse;

  if (!response.ok || !data.access_token) {
    throw new Error(
      data.error_description ||
        data.error ||
        "Failed to request Google Calendar access token.",
    );
  }

  return data.access_token;
}

async function requestGoogleCalendar(
  path: string,
  options: RequestInit,
) {
  const accessToken = await requestAccessToken();
  const response = await fetch(
    `${GOOGLE_CALENDAR_API_BASE}${path}`,
    {
      ...options,
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${accessToken}`,
        ...(options.headers ?? {}),
      },
    },
  );

  const data = (await response.json()) as GoogleEventResponse;

  if (!response.ok) {
    throw new Error(
      data.error?.message ||
        `Google Calendar API request failed with ${response.status}.`,
    );
  }

  return data;
}

function encodeCalendarPathPart(value: string) {
  return encodeURIComponent(value);
}

export function getGoogleCalendarId() {
  return getRequiredEnv("GOOGLE_CALENDAR_ID");
}

export async function createGoogleCalendarEvent(
  calendarId: string,
  event: GoogleCalendarEventPayload,
) {
  const data = await requestGoogleCalendar(
    `/calendars/${encodeCalendarPathPart(calendarId)}/events`,
    {
      method: "POST",
      body: JSON.stringify(event),
    },
  );

  if (!data.id) {
    throw new Error("Google Calendar event id was not returned.");
  }

  return data.id;
}

export async function updateGoogleCalendarEvent(
  calendarId: string,
  eventId: string,
  event: GoogleCalendarEventPayload,
) {
  const data = await requestGoogleCalendar(
    `/calendars/${encodeCalendarPathPart(
      calendarId,
    )}/events/${encodeCalendarPathPart(eventId)}`,
    {
      method: "PATCH",
      body: JSON.stringify(event),
    },
  );

  if (!data.id) {
    throw new Error("Google Calendar event id was not returned.");
  }

  return data.id;
}
