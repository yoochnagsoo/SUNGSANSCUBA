import {
  NextRequest,
  NextResponse,
} from "next/server";

import { requireAdminMutation } from "@/lib/adminAuth";
import { buildGoogleCalendarSyncItems } from "@/lib/googleCalendar/buildSyncItems";
import { syncGoogleCalendarItems } from "@/lib/googleCalendar/syncGoogleCalendar";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const auth = await requireAdminMutation(request);

  if (!auth.ok) {
    return auth.response;
  }

  try {
    const items = await buildGoogleCalendarSyncItems();
    const result = await syncGoogleCalendarItems(items);

    return NextResponse.json(result, {
      status: result.ok ? 200 : 207,
    });
  } catch (error) {
    console.error("[POST /api/admin/calendar/google-sync]", error);

    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Google Calendar sync failed.",
      },
      {
        status: 500,
      },
    );
  }
}
